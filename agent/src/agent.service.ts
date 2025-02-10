import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IAgentInteractionServiceInterface } from './agent-interactions/agent-interaction.service.interface';
import NotAvailableError from './_common/errors/not-available.error';
import { SafeMultisigService } from './external-multisig/safe-multisig.service';
import { AgentConfiguration } from './agent-configuration';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { createCron } from './_common/helpers/cron.helper';
import { safeFireAndForget } from './_common/helpers/promises.helper';

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
      const task = () => safeFireAndForget(() => this.getProposedTransaction());
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

  public async interact<T, S>(interactionKey: string, params?: T): Promise<S> {
    const interaction: IAgentInteractionServiceInterface<T | undefined, S> =
      this.resolveInteraction(interactionKey);
    return await interaction.performInteraction(params);
  }

  public async getProposedTransaction() {
    const multisigs = AgentConfiguration.getMultisigs();
    if (multisigs.length > 0) {
      const multisig = multisigs[0];
      console.log('GET FOR', multisig.address);
      const txProposed = await this._safeAgentService.getProposedTransaction({
        multisig: multisig.address,
        chainId: multisig.chainId,
        rpcUrl: multisig.rpcUrl,
      });
      console.log('PROPOSEDTX', txProposed);
    }
  }
}
