import { Multisig } from 'src/agent-configuration';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

export interface ProposalTx {
  multisigs: Multisig[];
  proposalTxs: MultisigTransaction[];
}
export interface IAgentCheckServiceInterface {
  performCheck(proposalTx: ProposalTx): Promise<boolean>;
}
