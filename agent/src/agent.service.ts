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
import { IAgentCheckServiceInterface } from './agent-checks/agent-checks.service.interface';
import {
  MultisigTransaction,
  SafeMultisigService,
} from './external-multisig/external-multisig.module';
import { AgentLocalSignerService } from './agent-signer/agent-signer.module';

@Injectable()
export class AgentService {
  constructor(
    private readonly _moduleRef: ModuleRef,
    private readonly _schedulerRegistry: SchedulerRegistry,
    @Inject() private readonly _safeAgentService: SafeMultisigService,
    @Inject() private readonly _agentLocalSigner: AgentLocalSignerService,
  ) {
    safeFireAndForget(() => this.setAgent());
  }

  private async setAgent() {
    if (AgentConfiguration.isProposalListener()) {
      const task = () => safeFireAndForget(() => this.performChecks());
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

  private async performChecks() {
    const operations = AgentConfiguration.getTxsToOperate();
    const multisigs = AgentConfiguration.getMultisigs();
    const proposedTxs = await this.getProposedTransactions(multisigs);
    const txsToExecute: Record<
      string,
      { multisigs: Multisig[]; proposedTxs: MultisigTransaction[] }
    > = {};
    operations.forEach((op) => {
      if (!txsToExecute[op])
        txsToExecute[op] = { multisigs: [], proposedTxs: [] };
      txsToExecute[op].multisigs = proposedTxs
        .filter((pt) => pt.proposedTxName == op)
        .map((pt) => pt.multisig);
      txsToExecute[op].proposedTxs = proposedTxs
        .filter((pt) => pt.proposedTxName == op)
        .map((pt) => pt.proposedTx);
    });
    Object.keys(txsToExecute).forEach((op) => {
      safeFireAndForget(async () => {
        await this.handleOperationCheck(op, txsToExecute[op]);
      });
    });
  }

  private async handleOperationCheck(
    operationName: string,
    proposedTxs: {
      multisigs: Multisig[];
      proposedTxs: MultisigTransaction[];
    },
  ) {
    const txToOperate = AgentConfiguration.getTxToOperate(operationName);
    const { readyToReplicate, waitingForChainIds } = this.isReadyToReplicate(
      proposedTxs.multisigs,
      txToOperate,
    );
    if (txToOperate.holdToReplicate && !readyToReplicate) {
      console.log(
        operationName,
        'is not ready to replicate.',
        'Waiting for:[',
        waitingForChainIds.join(','),
        ']',
      );
      return;
    }

    const agentChecks = AgentConfiguration.getAgentChecks();
    const checks = agentChecks.map((ac) => {
      return { checkKey: ac, checker: this.resolveChecker(ac) };
    });

    const checkResult = await Promise.all(
      checks.map(async (c) => {
        return {
          checkKey: c.checkKey,
          result: await c.checker.performCheck(proposedTxs),
        };
      }),
    );

    const checkFails = checkResult.filter((cr) => !cr.result);

    if (checkFails.length > 0) {
      checkFails.forEach((cf) => console.log('Checks dont pass', cf.checkKey));
      return;
    }
  }

  private isReadyToReplicate(
    multiSigsToBeUsedInProposedTxs: Multisig[],
    txToOperate: TxToOperate,
  ): { readyToReplicate: boolean; waitingForChainIds: string[] } {
    const setCurrent = new Set(
      multiSigsToBeUsedInProposedTxs.map((m) => m.chainId),
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

  private async getProposedTransactions(multisigs: Multisig[]) {
    const proposedTxs: {
      multisig: Multisig;
      proposedTxName: string;
      proposedTx: MultisigTransaction;
    }[] = [];
    for (const multisig of multisigs) {
      const proposedTx = await this.getProposedTransaction(multisig);
      if (proposedTx) {
        const agentHasAlreadyConfirmed = proposedTx.confirmations?.find(
          async (c) =>
            c.owner == (await this._agentLocalSigner.getSignerAddress()),
        );
        if (!agentHasAlreadyConfirmed) {
          //TODO: We need to consider native transfers
          if (proposedTx?.dataDecoded?.method) {
            proposedTxs.push({
              multisig,
              proposedTxName: proposedTx.dataDecoded?.method,
              proposedTx: proposedTx,
            });
          }
        }
      }
    }
    return proposedTxs;
  }

  public async getProposedTransaction(multisig: Multisig) {
    const txProposed = await this._safeAgentService.getProposedTransaction({
      multisig: multisig.address,
      chainId: multisig.chainId,
      rpcUrl: multisig.rpcUrl,
    });
    return txProposed;
  }
}
