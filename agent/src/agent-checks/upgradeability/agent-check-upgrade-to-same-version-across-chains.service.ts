import { Injectable } from '@nestjs/common';
import { IAgentCheckServiceInterface } from '../agent-checks.service.interface';

@Injectable()
export class AgentCheckUpgradeToSameVersionAcrossChainsService
  implements IAgentCheckServiceInterface
{
  performCheck(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
