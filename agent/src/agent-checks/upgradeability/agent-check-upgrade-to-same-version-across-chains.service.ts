import { Injectable } from '@nestjs/common';
import {
  IAgentCheckServiceInterface,
  ProposalTxs,
} from '../agent-checks.service.interface';
import { Multisig } from 'src/agent-configuration';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

@Injectable()
export class AgentCheckUpgradeToSameVersionAcrossChainsService
  implements IAgentCheckServiceInterface
{
  async performCheck(proposedTx: ProposalTxs): Promise<boolean> {
    return true;
  }
}
