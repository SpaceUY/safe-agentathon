import { Injectable } from '@nestjs/common';
import { IAgentCheckServiceInterface } from '../agent-checks.service.interface';

@Injectable()
export class AgentCheckUpgradeVerificationService
  implements IAgentCheckServiceInterface
{
  performCheck(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
