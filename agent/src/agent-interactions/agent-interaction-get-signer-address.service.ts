import { Injectable } from '@nestjs/common';
import { IAgentInteractionServiceInterface } from './agent-interaction.service.interface';

@Injectable()
export class AgentInteractionGetSignerAddressService
  implements IAgentInteractionServiceInterface<any, string>
{
  performInteraction(param: any): Promise<string> {
    return Promise.resolve('0x9124D8A9A98BE11162Dbc6EC713E14B15Cee6686');
  }
}
