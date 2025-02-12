import { Inject, Injectable } from '@nestjs/common';
import { IAgentInteractionServiceInterface } from './agent-interaction.service.interface';
import * as speakeasy from 'speakeasy';
import { AgentConfiguration } from 'src/agent-configuration';
import { IAgentStateService } from 'src/agent-state/agent-state.module';

@Injectable()
export class AgentInteractionPushTwoFAcodeService
  implements IAgentInteractionServiceInterface<{ token: string }, string>
{
  private readonly secret: string = AgentConfiguration.getTotp();

  constructor(
    @Inject('AgentMemoryStateService')
    private readonly _agentStateService: IAgentStateService,
  ) {}

  async performInteraction(param: { token: string }): Promise<string> {
    if (!this._agentStateService.isThereAProposalWaitingForTwoFA())
      return 'There is no operation waiting for 2fa';
    const isTokenValid = speakeasy.totp.verify({
      secret: this.secret,
      encoding: 'base32',
      token: param.token,
      window: 1,
    });
    if (isTokenValid) {
      this._agentStateService.confirmTwoFA();
    }
    return isTokenValid
      ? 'Valid code, operation successful'
      : 'Invalid code, operation failed';
  }
}
