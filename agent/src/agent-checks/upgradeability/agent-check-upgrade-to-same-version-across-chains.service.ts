import { Injectable } from '@nestjs/common';
import {
  IAgentCheckServiceInterface,
  ProposalTxs,
} from '../agent-checks.service.interface';

@Injectable()
export class AgentCheckUpgradeToSameVersionAcrossChainsService
  implements IAgentCheckServiceInterface
{
  async performCheck(proposedTx: ProposalTxs): Promise<boolean> {
    return true;
  }
}
