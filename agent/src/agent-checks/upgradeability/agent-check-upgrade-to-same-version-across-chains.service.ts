import { Injectable } from '@nestjs/common';
import { IAgentCheckServiceInterface } from '../agent-checks.service.interface';
import { Multisig } from 'src/agent-configuration';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

@Injectable()
export class AgentCheckUpgradeToSameVersionAcrossChainsService
  implements IAgentCheckServiceInterface
{
  performCheck(proposedTx: {
    multisigs: Multisig[];
    proposedTxs: MultisigTransaction[];
  }): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
