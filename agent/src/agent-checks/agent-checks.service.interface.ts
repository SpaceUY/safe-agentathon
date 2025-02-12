import { Multisig } from 'src/agent-configuration';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

export interface ProposalTxs {
  operationName: string;
  multisigs: Multisig[];
  multisigTxs: MultisigTransaction[];
  proposalTxs: ProposalTx[];
}
export interface ProposalTx {
  multisig: Multisig;
  multisigTx: MultisigTransaction;
}

export interface IAgentCheckServiceInterface {
  performCheck(proposalTxs: ProposalTxs): Promise<boolean>;
}
