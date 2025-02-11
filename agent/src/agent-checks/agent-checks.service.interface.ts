import { Multisig } from 'src/agent-configuration';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

export interface IAgentCheckServiceInterface {
  performCheck(proposedTx: {
    multisigs: Multisig[];
    proposedTxs: MultisigTransaction[];
  }): Promise<boolean>;
}
