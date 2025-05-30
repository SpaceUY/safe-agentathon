import { Inject, Injectable, Logger } from '@nestjs/common';
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
import {
  evalProposalToConfirmOrExecute,
  getProposalIdentificator,
} from './_common/helpers/proposalTxs';
import { IAgentMessagingService } from './agent-messaging/agent-messaging.interface.service';
import { LoggerInterface } from './agent-logger/agent-logger.interface';

@Injectable()
export class AgentService {
  constructor(
    private readonly _moduleRef: ModuleRef,
    private readonly _schedulerRegistry: SchedulerRegistry,
    @Inject('Logger') private readonly _logger: LoggerInterface,
    @Inject() private readonly _safeAgentService: SafeMultisigService,
    @Inject('AgentLocalSignerService')
    private readonly _agentSigner: IAgentSignerService,
    @Inject('AgentMemoryStateService')
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
    this._logger.info('AGENT ID: ' + AgentConfiguration.getAgentId());
    this._logger.info(
      'SIGNER READY: ' + (await this._agentSigner.getSignerAddress()),
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

  private resolveMessagingService(): IAgentMessagingService | undefined {
    let messagingService: IAgentMessagingService | undefined;
    try {
      messagingService = this._moduleRef.get<IAgentMessagingService>(
        'AgentMessagingService',
      );
    } catch (ex) {
      this._logger.error(ex);
    }
    return messagingService;
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
      const proposalTransactions = await this.getLatestProposalsTransactions(
        operations,
        multisigs,
      );
      const proposal = this.getProposalToAttend(proposalTransactions);
      if (!proposal) {
        this._logger.info('No proposals available at the moment');
        this._agentStateService.state = AgentState.IDLE;
      } else {
        this._logger.info('Proposal available');
        const { proposalTxs, status } =
          await this.evalProposalExecution(proposal);
        this._logger.info(`Proposal evaluation completed with ${status}`);
        if (status == 'ready') {
          this._agentStateService.addProposalReadyToExecute(proposalTxs);
          this._agentStateService.state = AgentState.EXECUTING;
        } else if (status == 'two-fa-required') {
          this._agentStateService.addProposalForTwoFAConfirmation(proposalTxs);
          this._agentStateService.state = AgentState.WAITING_FOR_TWO_FA;
          safeFireAndForget(() =>
            Promise.resolve(
              this.resolveMessagingService()?.send2FACode(
                AgentConfiguration.getAgentId(),
                AgentConfiguration.getAgentNotificationTo()!.value,
              ),
            ),
          );
        } else {
          this._agentStateService.state = AgentState.IDLE;
        }
      }
    } else if (agentState == AgentState.WAITING_FOR_TWO_FA) {
      this._logger.info(
        'Awaiting two-factor authentication (2FA) verification',
      );
      const proposalTxs = this._agentStateService.getProposalWaitingForTwoFA();
      if (proposalTxs) {
        const proposalIdentificator = getProposalIdentificator(proposalTxs);
        this._agentStateService.registerIntoProposalEvaluationPool(
          proposalIdentificator,
          { twoFAapproved: true },
        );
        this._agentStateService.addProposalReadyToExecute(proposalTxs);
        this._agentStateService.state = AgentState.EXECUTING;
      } else if (!this._agentStateService.isThereAProposalWaitingForTwoFA()) {
        this._agentStateService.state = AgentState.IDLE;
      }
    } else if (agentState == AgentState.EXECUTING) {
      this._logger.info('Executing proposal');
      const proposalTxs = this._agentStateService.getProposalReadyToExecute();
      if (proposalTxs) {
        const executedSucessfully = await this.confirmOrExecuteProposal(
          proposalTxs,
          AgentConfiguration.holdToReplicate(proposalTxs.operationName),
        );
        if (executedSucessfully)
          this._agentStateService.state = AgentState.IDLE;
      } else this._agentStateService.state = AgentState.IDLE;
    }
  }

  private getProposalToAttend(
    txs: Record<string, ProposalTxs>,
  ): ProposalTxs | undefined {
    let proposalsAcrossChain = 0;
    let result: ProposalTxs | undefined;
    Object.keys(txs).forEach((op) => {
      const proposals = txs[op].multisigTxs.length;
      if (proposals > proposalsAcrossChain) result = txs[op];
    });
    return result;
  }

  private async evalProposalExecution(proposalTxs: ProposalTxs): Promise<{
    proposalTxs: ProposalTxs;
    status: 'hold-to-check' | 'checks-not-passed' | 'two-fa-required' | 'ready';
  }> {
    const { operationName } = proposalTxs;

    const txToOperate = AgentConfiguration.getTxToOperate(operationName);
    if (txToOperate.holdToCheck) {
      const { readyToCheck, waitingForChainIds } = this.isReadyToCheck(
        proposalTxs.multisigs,
        txToOperate,
      );
      if (!readyToCheck) {
        this._logger.info(
          `${operationName} is not ready to check. Waiting for:[${waitingForChainIds.join(',')}]`,
        );
        return {
          proposalTxs,
          status: 'hold-to-check',
        };
      }
    }

    const proposalIdentificator = getProposalIdentificator(proposalTxs);

    const { checksPassed, twoFAapproved } =
      this._agentStateService.registerIntoProposalEvaluationPool(
        proposalIdentificator,
      );

    if (!checksPassed) {
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
        checkFails.forEach((cf) =>
          this._logger.info('Checks dont pass ' + cf.checkKey),
        );
        return {
          proposalTxs: proposalTxs,
          status: 'checks-not-passed',
        };
      }
      this._agentStateService.registerIntoProposalEvaluationPool(
        proposalIdentificator,
        { checksPassed: true },
      );
    }

    this._logger.info('Checks passed');

    return {
      proposalTxs: proposalTxs,
      status: txToOperate.twoFARequired
        ? twoFAapproved
          ? 'ready'
          : 'two-fa-required'
        : 'ready',
    };
  }

  private isReadyToCheck(
    multiSigsToBeUsedInproposalTxs: Multisig[],
    txToOperate: TxToOperate,
  ): { readyToCheck: boolean; waitingForChainIds: string[] } {
    const setCurrent = new Set(
      multiSigsToBeUsedInproposalTxs.map((m) => m.chainId),
    );
    const setExpected = new Set(txToOperate.chainIds);
    const intersection = new Set(
      [...setCurrent].filter((chainId) => setExpected.has(chainId)),
    );
    const readyToCheck =
      intersection.size == setCurrent.size &&
      intersection.size == setExpected.size;

    const waitingForChainIds = [...setExpected].filter(
      (chainId) => !setCurrent.has(chainId),
    );

    return { readyToCheck, waitingForChainIds };
  }

  private async getLatestProposalsTransactions(
    operations: string[],
    multisigs: Multisig[],
  ): Promise<Record<string, ProposalTxs>> {
    const proposalTxs: {
      operationName: string;
      multisig: Multisig;
      multisigTx: MultisigTransaction;
    }[] = [];
    for (const multisig of multisigs) {
      const latestsProposalTxs =
        await this.getLatestProposalTransaction(multisig);
      if (latestsProposalTxs) {
        const isContractCall = latestsProposalTxs?.dataDecoded?.method;
        const isNativeTransfer =
          !isContractCall && BigInt(latestsProposalTxs.value) > 0n;
        if (isNativeTransfer) {
          proposalTxs.push({
            operationName: '[NATIVE_TRANSFER]',
            multisig,
            multisigTx: latestsProposalTxs,
          });
        } else if (isContractCall) {
          proposalTxs.push({
            operationName: latestsProposalTxs.dataDecoded?.method,
            multisig,
            multisigTx: latestsProposalTxs,
          });
        }
      }
    }
    const txs: Record<string, ProposalTxs> = {};
    operations.forEach((op) => {
      if (!txs[op])
        txs[op] = {
          operationName: op,
          multisigs: [],
          multisigTxs: [],
          proposalTxs: [],
        };
      txs[op].multisigs = proposalTxs
        .filter((pt) => pt.operationName == op)
        .map((pt) => pt.multisig);
      txs[op].multisigTxs = proposalTxs
        .filter((pt) => pt.operationName == op)
        .map((pt) => pt.multisigTx);
      txs[op].proposalTxs = proposalTxs.filter((pt) => pt.operationName == op);
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
  ): Promise<boolean> {
    try {
      const agentSignerAddress = await this._agentSigner.getSignerAddress();
      const isMultisigExecutor = AgentConfiguration.isMultisigExecutor();

      const { toConfirm, toExecute } = evalProposalToConfirmOrExecute(
        proposalTxs,
        agentSignerAddress,
        isMultisigExecutor,
      );

      this._logger.info(
        `To confirm ${toConfirm.length} | To execute ${toExecute.length}`,
      );

      //Bad practice this will be tackled differently
      const signerKey = await this._agentSigner.getSignerKey();

      const executions: (() => Promise<void>)[] = [];
      for (let i = 0; i < toExecute.length; i++) {
        const multisig = toExecute[i].multisig;
        const multisigTx = toExecute[i].multisigTx;
        executions.push(() =>
          this._safeAgentService.execProposedTransaction({
            multisig: multisig.address,
            rpcUrl: multisig.rpcUrl,
            proposedTx: multisigTx,
            signerKey,
          }),
        );
      }

      const confirmations: (() => Promise<void>)[] = [];
      for (let i = 0; i < toConfirm.length; i++) {
        const multisig = toConfirm[i].multisig;
        const multisigTx = toConfirm[i].multisigTx;
        confirmations.push(() =>
          this._safeAgentService.confirmProposedTransaction({
            multisig: multisig.address,
            rpcUrl: multisig.rpcUrl,
            chainId: multisig.chainId,
            proposedTx: multisigTx,
            signerKey,
          }),
        );
      }
      if (toConfirm.length > 0) {
        this._logger.info('Confirming proposals ' + toConfirm.length);
        await Promise.all(confirmations.map((fn) => fn()));
      }
      if (holdToReplicate) {
        if (toConfirm.length == 0 && toExecute.length > 0) {
          this._logger.info('Executing proposals ' + toExecute.length);
          await Promise.all(executions.map((fn) => fn()));
        }
      } else if (toExecute.length > 0) {
        this._logger.info('Executing proposals ' + toExecute.length);
        await Promise.all(executions.map((fn) => fn()));
      }

      return true;
    } catch (ex) {
      this._logger.error('Error while executing confirmOrExecuteProposal');
      return false;
    }
  }
}
