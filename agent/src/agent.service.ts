import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IAgentInteractionServiceInterface } from './agent-interactions/agent-interaction.service.interface';
import NotAvailableError from './_common/errors/not-available.error';
import { SafeMultisigService } from './external-multisig/safe-multisig.service';
import { AgentConfiguration, MultiSig } from './agent-configuration';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { createCron } from './_common/helpers/cron.helper';
import { safeFireAndForget } from './_common/helpers/promises.helper';
import { IAgentCheckServiceInterface } from './agent-checks/agent-checks.service.interface';

@Injectable()
export class AgentService {
  constructor(
    private readonly _moduleRef: ModuleRef,
    private readonly _schedulerRegistry: SchedulerRegistry,
    @Inject() private readonly _safeAgentService: SafeMultisigService,
  ) {
    this.setAgent();
  }

  private setAgent() {
    if (AgentConfiguration.isProposalListener()) {
      const task = () => safeFireAndForget(() => this.performChecks());
      const job = createCron(CronExpression.EVERY_10_SECONDS, task);
      this._schedulerRegistry.addCronJob('proposalListener', job);
    }
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
    const proposedTxs = this.getProposedTransactions(multisigs);
  }

  private async getProposedTransactions(multisigs: MultiSig[]) {
    const proposedTxs: { multisig: MultiSig; proposedTxName: string }[] = [];
    for (const multisig of multisigs) {
      const proposedTx = await this.getProposedTransaction(multisig);
      if (proposedTx?.dataDecoded?.method)
        //TODO: We are ignoring native transfers
        proposedTxs.push({
          multisig,
          proposedTxName: proposedTx?.dataDecoded?.method,
        });
    }
    return proposedTxs;
  }

  public async getProposedTransaction(multisig: MultiSig) {
    const txProposed = await this._safeAgentService.getProposedTransaction({
      multisig: multisig.address,
      chainId: multisig.chainId,
      rpcUrl: multisig.rpcUrl,
    });
    return txProposed;
  }
}
