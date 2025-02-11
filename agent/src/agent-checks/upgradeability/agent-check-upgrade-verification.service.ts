import { Injectable } from '@nestjs/common';
import {
  IAgentCheckServiceInterface,
  ProposalTx,
} from '../agent-checks.service.interface';
import { Multisig } from 'src/agent-configuration';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

@Injectable()
export class AgentCheckUpgradeVerificationService
  implements IAgentCheckServiceInterface
{
  async performCheck(proposedTx: ProposalTx): Promise<boolean> {
    return true;
  }
}
