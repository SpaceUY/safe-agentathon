import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IAgentInteractionServiceInterface } from './agent-interactions/agent-interaction.service.interface';
import NotAvailableError from './_common/errors/not-available.error';
import {
  AgentConfiguration,
  Multisig,
  TxToOperate,
} from './agent-configuration';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { createCron } from './_common/helpers/cron.helper';
import { safeFireAndForget } from './_common/helpers/promises.helper';
import {
  IAgentCheckServiceInterface,
  ProposalTxs,
} from './agent-checks/agent-checks.service.interface';
import {
  MultisigTransaction,
  SafeMultisigService,
} from './external-multisig/external-multisig.module';
import { IAgentSignerService } from './agent-signer/agent-signer.service.interface';
import {
  AgentState,
  IAgentStateService,
} from './agent-state/agent-state.service.interface';

@Injectable()
export class AgentService {
  constructor(
    private readonly _moduleRef: ModuleRef,
    private readonly _schedulerRegistry: SchedulerRegistry,
    @Inject() private readonly _safeAgentService: SafeMultisigService,
    @Inject('IAgentSignerService')
    private readonly _agentSigner: IAgentSignerService,
    @Inject('IAgentStateService')
    private readonly _agentStateService: IAgentStateService,
  ) {
    safeFireAndForget(() => this.setAgent());
  }

  private async setAgent() {
    this._agentStateService.state = AgentState.IDLE;
    if (AgentConfiguration.isProposalListener()) {
      const task = () => safeFireAndForget(() => this.handleProposals());
      const job = createCron(CronExpression.EVERY_10_SECONDS, task);
      this._schedulerRegistry.addCronJob('proposalListener', job);
    }
    await this._agentSigner.createSigner();
    console.log('SIGNER READY', await this._agentSigner.getSignerAddress());
  }

  private resolveInteraction<T, S>(interactionKey: string) {
    let interaction: IAgentInteractionServiceInterface<T, S>;
    try {
      interaction =
        this._moduleRef.get<IAgentInteractionServiceInterface<T, S>>(
          interactionKey,
        );
    } catch (ex) {
      throw new NotAvailableError('Interaction not found or not configured');
    }

    return interaction;
  }

  private resolveChecker(checkerKey: string) {
    let interaction: IAgentCheckServiceInterface;
    try {
      interaction =
        this._moduleRef.get<IAgentCheckServiceInterface>(checkerKey);
    } catch (ex) {
      throw new NotAvailableError('Checker not found or not configured');
    }

    return interaction;
  }

  public async performInteraction<T, S>(
    interactionKey: string,
    params?: T,
  ): Promise<S> {
    const interaction: IAgentInteractionServiceInterface<T | undefined, S> =
      this.resolveInteraction(interactionKey);
    return await interaction.performInteraction(params);
  }

  private async handleProposals() {
    const agentState = this._agentStateService.state;
    if (agentState == AgentState.IDLE) {
      this._agentStateService.state = AgentState.PROCESSING;
      const operations = AgentConfiguration.getTxsToOperate();
      const multisigs = AgentConfiguration.getMultisigs();
      const txs = await this.getLatestProposalTransactions(
        operations,
        multisigs,
      );
      const proposal = this.getProposal(txs);
      if (!proposal) {
        console.log('No proposal found');
        this._agentStateService.state = AgentState.IDLE;
      } else {
        const { proposalTxs, status } =
          await this.evalProposalExecution(proposal);
        if (status == 'ready') {
          this._agentStateService.addProposal(proposalTxs);
          this._agentStateService.state = AgentState.EXECUTING;
          await this.confirmOrExecuteProposal(
            proposalTxs,
            AgentConfiguration.holdToReplicate(proposalTxs.operationName),
          );
        } else if (status == 'two-fa-required') {
          this._agentStateService.addForTwoFAConfirmation(proposalTxs);
          this._agentStateService.state = AgentState.WAITING_FOR_TWO_FA;
        } else {
          this._agentStateService.state = AgentState.IDLE;
        }
      }
    } else if (agentState == AgentState.WAITING_FOR_TWO_FA) {
      const proposalTxs = this._agentStateService.getProposalWaitingForTwoFA();
      if (proposalTxs) {
        this._agentStateService.addProposal(proposalTxs);
        this._agentStateService.state = AgentState.EXECUTING;
        await this.confirmOrExecuteProposal(
          proposalTxs,
          AgentConfiguration.holdToReplicate(proposalTxs.operationName),
        );
      } else if (!this._agentStateService.isThereAProposalWaitingForTwoFA()) {
        this._agentStateService.state = AgentState.IDLE;
      }
    } else if (agentState == AgentState.EXECUTING) {
      const proposalTxs = this._agentStateService.getProposal();
      if (proposalTxs) {
        await this.confirmOrExecuteProposal(
          proposalTxs,
          AgentConfiguration.holdToReplicate(proposalTxs.operationName),
        );
      } else this._agentStateService.state = AgentState.IDLE;
    }
  }

  private getProposal(
    txs: Record<string, ProposalTxs>,
  ): ProposalTxs | undefined {
    let proposalsAcrossChain = 0;
    let result;
    Object.keys(txs).forEach((op) => {
      const proposals = txs[op].proposalTxs.length;
      if (proposals > proposalsAcrossChain)
        result = { operationName: op, proposalTxs: txs[op].proposalTxs };
    });
    return result;
  }

  private async evalProposalExecution(proposalTxs: ProposalTxs): Promise<{
    proposalTxs: ProposalTxs;
    status: 'hold-to-check' | 'checks-not-passed' | 'two-fa-required' | 'ready';
    holdToReplicate: boolean;
  }> {
    const { operationName } = proposalTxs;

    const txToOperate = AgentConfiguration.getTxToOperate(operationName);
    if (txToOperate.holdToCheck) {
      const { readyToReplicate, waitingForChainIds } = this.isReadyToCheck(
        proposalTxs.multisigs,
        txToOperate,
      );
      if (!readyToReplicate) {
        console.log(
          operationName,
          'is not ready to replicate.',
          'Waiting for:[',
          waitingForChainIds.join(','),
          ']',
        );
        return {
          proposalTxs,
          status: 'hold-to-check',
          holdToReplicate: txToOperate.holdToReplicate,
        };
      }
    }

    const agentChecks = AgentConfiguration.getAgentChecks();
    const checks = agentChecks.map((ac) => {
      return { checkKey: ac, checker: this.resolveChecker(ac) };
    });

    const checkResult = await Promise.all(
      checks.map(async (c) => {
        return {
          checkKey: c.checkKey,
          result: await c.checker.performCheck(proposalTxs),
        };
      }),
    );
    const checkFails = checkResult.filter((cr) => !cr.result);
    if (checkFails.length > 0) {
      checkFails.forEach((cf) => console.log('Checks dont pass', cf.checkKey));
      return {
        proposalTxs: proposalTxs,
        status: 'checks-not-passed',
        holdToReplicate: txToOperate.holdToReplicate,
      };
    }
    return {
      proposalTxs: proposalTxs,
      status: txToOperate.twoFArequired ? 'two-fa-required' : 'ready',
      holdToReplicate: txToOperate.holdToReplicate,
    };
  }

  private isReadyToCheck(
    multiSigsToBeUsedInproposalTxs: Multisig[],
    txToOperate: TxToOperate,
  ): { readyToReplicate: boolean; waitingForChainIds: string[] } {
    const setCurrent = new Set(
      multiSigsToBeUsedInproposalTxs.map((m) => m.chainId),
    );
    const setExpected = new Set(txToOperate.chainIds);
    const intersection = new Set(
      [...setCurrent].filter((chainId) => setExpected.has(chainId)),
    );
    const readyToReplicate =
      intersection.size == setCurrent.size &&
      intersection.size == setExpected.size;

    const waitingForChainIds = [...setExpected].filter(
      (chainId) => !setCurrent.has(chainId),
    );

    return { readyToReplicate, waitingForChainIds };
  }

  private async getLatestProposalTransactions(
    operations: string[],
    multisigs: Multisig[],
  ): Promise<Record<string, ProposalTxs>> {
    const proposalTxs: {
      multisig: Multisig;
      proposalTxName: string;
      proposalTx: MultisigTransaction;
    }[] = [];
    for (const multisig of multisigs) {
      const latestsProposalTxs =
        await this.getLatestProposalTransaction(multisig);
      if (latestsProposalTxs) {
        //TODO: We need to consider native transfers
        if (latestsProposalTxs?.dataDecoded?.method) {
          proposalTxs.push({
            multisig,
            proposalTxName: latestsProposalTxs.dataDecoded?.method,
            proposalTx: latestsProposalTxs,
          });
        }
      }
    }
    const txs: Record<string, ProposalTxs> = {};
    operations.forEach((op) => {
      if (!txs[op])
        txs[op] = { operationName: op, multisigs: [], proposalTxs: [] };
      txs[op].multisigs = proposalTxs
        .filter((pt) => pt.proposalTxName == op)
        .map((pt) => pt.multisig);
      txs[op].proposalTxs = proposalTxs
        .filter((pt) => pt.proposalTxName == op)
        .map((pt) => pt.proposalTx);
    });
    return txs;
  }

  private async getLatestProposalTransaction(multisig: Multisig) {
    const txproposal =
      await this._safeAgentService.getLatestProposalTransaction({
        multisig: multisig.address,
        chainId: multisig.chainId,
        rpcUrl: multisig.rpcUrl,
      });
    return txproposal;
  }

  private async confirmOrExecuteProposal(
    proposalTxs: ProposalTxs,
    holdToReplicate: boolean,
  ) {
    try {
      const agentSignerAddress = await this._agentSigner.getSignerAddress();
      const proposalsAlreadyConfirmed = proposalTxs.proposalTxs.filter((pt) => {
        pt.confirmations?.some((c) => c.owner == agentSignerAddress);
      });
      const proposalsNotConfirmed = proposalTxs.proposalTxs.filter((pt) => {
        !pt.confirmations?.some((c) => c.owner == agentSignerAddress);
      });

      if (proposalsAlreadyConfirmed.length == proposalTxs.proposalTxs.length) {
        //Execute if payer
      } else {
        //Have to confirm pendings and execute if not holdToReplicate
        if (proposalsAlreadyConfirmed.length > 0 && !holdToReplicate) {
          //Execute if payer
        }
        if (proposalsNotConfirmed.length > 0) {
          //Confirm
        }
      }
    } catch (ex) {
      console.log('Error while executing confirmOrExecuteProposal');
    }
  }
}
