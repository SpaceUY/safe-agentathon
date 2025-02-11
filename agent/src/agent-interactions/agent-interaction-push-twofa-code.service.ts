import { Injectable } from '@nestjs/common';
import { IAgentInteractionServiceInterface } from './agent-interaction.service.interface';
import * as speakeasy from 'speakeasy';
import { AgentConfiguration } from 'src/agent-configuration';

@Injectable()
export class AgentInteractionPushTwoFAcodeService
  implements IAgentInteractionServiceInterface<string, string>
{
  private readonly secret: string = AgentConfiguration.getTotp();

  async performInteraction(token: string): Promise<string> {
    const isTokenValid = speakeasy.totp.verify({
      secret: this.secret,
      encoding: 'base32',
      token,
      window: 1, // Allows for slight time drift
    });

    return isTokenValid
      ? 'Valid code, operation successful'
      : 'Invalid code, operation failed';
  }
}
