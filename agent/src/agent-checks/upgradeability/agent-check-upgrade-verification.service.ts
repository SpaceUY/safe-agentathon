import { Injectable } from '@nestjs/common';
import { IAgentCheckServiceInterface } from '../agent-checks.service.interface';

@Injectable()
export class AgentCheckUpgradeVerificationService
  implements IAgentCheckServiceInterface
{
  performCheck(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
