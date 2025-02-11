import { Inject, Injectable } from '@nestjs/common';
import { IAgentInteractionServiceInterface } from './agent-interaction.service.interface';
import * as speakeasy from 'speakeasy';
import { AgentConfiguration } from 'src/agent-configuration';
import { AgentStateService } from 'src/agent-state.service';

@Injectable()
export class AgentInteractionPushTwoFAcodeService
  implements IAgentInteractionServiceInterface<string, string>
{
  private readonly secret: string = AgentConfiguration.getTotp();

  constructor(private readonly _agentStateService: AgentStateService) {}

  async performInteraction(token: string): Promise<string> {
    if (!this._agentStateService.isThereAProposalWaitingForTwoFA())
      return 'There is no operation waiting for 2fa';
    const isTokenValid = speakeasy.totp.verify({
      secret: this.secret,
      encoding: 'base32',
      token,
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
