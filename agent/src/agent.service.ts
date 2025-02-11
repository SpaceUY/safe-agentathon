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
  ProposalTx,
} from './agent-checks/agent-checks.service.interface';
import {
  MultisigTransaction,
  SafeMultisigService,
} from './external-multisig/external-multisig.module';
import { AgentLocalSignerService } from './agent-signer/agent-signer.module';
import { AgentState, AgentStateService } from './agent-state.service';

@Injectable()
export class AgentService {
  constructor(
    private readonly _moduleRef: ModuleRef,
    private readonly _schedulerRegistry: SchedulerRegistry,
    @Inject() private readonly _safeAgentService: SafeMultisigService,
    @Inject() private readonly _agentLocalSigner: AgentLocalSignerService,
    @Inject() private readonly _agentStateService: AgentStateService,
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
    await this._agentLocalSigner.createSigner();
    console.log(
      'SIGNER READY',
      await this._agentLocalSigner.getSignerAddress(),
    );
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
      const proposalTxs = await this.getLatestProposalTransactions(multisigs);
      const txsToExecute: Record<
        string,
        { multisigs: Multisig[]; proposalTxs: MultisigTransaction[] }
      > = {};
      operations.forEach((op) => {
        if (!txsToExecute[op])
          txsToExecute[op] = { multisigs: [], proposalTxs: [] };

        txsToExecute[op].multisigs = proposalTxs
          .filter((pt) => pt.proposalTxName == op)
          .map((pt) => pt.multisig);
        txsToExecute[op].proposalTxs = proposalTxs
          .filter((pt) => pt.proposalTxName == op)
          .map((pt) => pt.proposalTx);
      });
      const proposalToExecute = this.getProposalToExecute(txsToExecute);
      if (!proposalToExecute) {
        console.log('No proposal to execute');
        this._agentStateService.state = AgentState.IDLE;
        return;
      }
      const { proposalTx, status } =
        await this.evalProposalExecution(proposalToExecute);
      if (status == 'ready-to-execute') {
        //Execute
      } else if (status == 'two-fa-required') {
        this._agentStateService.addForTwoFAConfirmation(proposalTx);
        this._agentStateService.state = AgentState.WAITING_FOR_TWO_FA;
      } else {
        this._agentStateService.state = AgentState.IDLE;
      }
    } else if (agentState == AgentState.WAITING_FOR_TWO_FA) {
    }
  }

  private getProposalToExecute(
    txsToExecute: Record<string, ProposalTx>,
  ): { operationName: string; proposalTx: ProposalTx } | undefined {
    let proposalsAcrossChain = 0;
    let result;
    Object.keys(txsToExecute).forEach((op) => {
      const proposals = txsToExecute[op].proposalTxs.length;
      if (proposals > proposalsAcrossChain)
        result = {
          operationName: op,
          proposalTxs: txsToExecute[op].proposalTxs,
        };
    });

    return result;
  }

  private async evalProposalExecution(proposalToExecute: {
    operationName: string;
    proposalTx: ProposalTx;
  }): Promise<{
    proposalTx: ProposalTx;
    status:
      | 'holding-to-replicate'
      | 'checks-not-passed'
      | 'two-fa-required'
      | 'ready-to-execute';
  }> {
    const { operationName, proposalTx } = proposalToExecute;
    const txToOperate = AgentConfiguration.getTxToOperate(operationName);

    if (txToOperate.holdToReplicate) {
      const { readyToReplicate, waitingForChainIds } = this.isReadyToReplicate(
        proposalTx.multisigs,
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
        return { proposalTx, status: 'holding-to-replicate' };
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
          result: await c.checker.performCheck(proposalTx),
        };
      }),
    );
    const checkFails = checkResult.filter((cr) => !cr.result);
    if (checkFails.length > 0) {
      checkFails.forEach((cf) => console.log('Checks dont pass', cf.checkKey));
      return {
        proposalTx: proposalTx,
        status: 'checks-not-passed',
      };
    }
    return {
      proposalTx: proposalTx,
      status: txToOperate.twoFArequired
        ? 'two-fa-required'
        : 'ready-to-execute',
    };
  }

  private isReadyToReplicate(
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

  private async getLatestProposalTransactions(multisigs: Multisig[]) {
    const proposalTxs: {
      multisig: Multisig;
      proposalTxName: string;
      proposalTx: MultisigTransaction;
    }[] = [];
    for (const multisig of multisigs) {
      const proposalTx = await this.getLatestProposalTransaction(multisig);
      if (proposalTx) {
        //TODO: We need to consider native transfers
        if (proposalTx?.dataDecoded?.method) {
          proposalTxs.push({
            multisig,
            proposalTxName: proposalTx.dataDecoded?.method,
            proposalTx: proposalTx,
          });
        }
      }
    }
    return proposalTxs;
  }

  public async getLatestProposalTransaction(multisig: Multisig) {
    const txproposal =
      await this._safeAgentService.getLatestProposalTransaction({
        multisig: multisig.address,
        chainId: multisig.chainId,
        rpcUrl: multisig.rpcUrl,
      });
    return txproposal;
  }
}
