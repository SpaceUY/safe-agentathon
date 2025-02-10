import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IAgentInteractionServiceInterface } from './agent-interactions/agent-interaction.service.interface';

@Injectable()
export class AgentService {
  constructor(private readonly _moduleRef: ModuleRef) {}

  private resolveInteraction<T, S>(interactionKey: string) {
    let interaction: IAgentInteractionServiceInterface<T, S>;
    try {
      interaction =
        this._moduleRef.get<IAgentInteractionServiceInterface<T, S>>(
          interactionKey,
        );
    } catch (ex) {
      throw new Error('Interaction not found or not configured');
    }

    return interaction;
  }

  public async interact<T, S>(interactionKey: string, params?: T): Promise<S> {
    const interaction: IAgentInteractionServiceInterface<T | undefined, S> =
      this.resolveInteraction(interactionKey);
    return await interaction.performInteraction(params);
  }
}
