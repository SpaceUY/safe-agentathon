import {
  ProposalTx,
  ProposalTxs,
} from 'src/agent-checks/agent-checks.service.interface';
import { MultisigTransaction } from 'src/external-multisig/safe-multisig.service';

export const getProposalIdentificator = (proposalTxs: ProposalTxs) => {
  let proposalIdentificator = proposalTxs.multisigTxs
    .map((mt) => mt.safeTxHash)
    .join();
  return proposalIdentificator;
};

export const evalProposalToConfirmOrExecute = (
  proposalTxs: ProposalTxs,
  agentSigner: string,
  isAgentMultisigExecutor: boolean,
): { toConfirm: ProposalTx[]; toExecute: ProposalTx[] } => {
  let toConfirm = proposalTxs.proposalTxs.filter(
    (ptxs) =>
      !ptxs.multisigTx.confirmations?.some((c) => c.owner === agentSigner),
  );
  let toExecute = !isAgentMultisigExecutor
    ? []
    : proposalTxs.proposalTxs.filter(
        (ptxs) =>
          !ptxs.multisigTx.confirmations?.some(
            (c) => c.owner === agentSigner,
          ) ||
          ptxs.multisigTx.confirmationsRequired ==
            ptxs.multisigTx.confirmations?.length,
      );

  return { toConfirm, toExecute };
};
