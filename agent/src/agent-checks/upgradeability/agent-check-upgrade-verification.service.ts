import { Injectable } from '@nestjs/common';
import {
  IAgentCheckServiceInterface,
  ProposalTxs,
} from '../agent-checks.service.interface';

@Injectable()
export class AgentCheckUpgradeVerificationService
  implements IAgentCheckServiceInterface
{
  async performCheck(proposedTx: ProposalTxs): Promise<boolean> {
    return true;
  }
}
