import { ProposalTxs } from 'src/agent-checks/agent-checks.service.interface';
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
): { toConfirm: MultisigTransaction[]; toExecute: MultisigTransaction[] } => {
  let toConfirm = proposalTxs.multisigTxs.filter((mt) =>
    mt.confirmations?.some((c) => c.owner != agentSigner),
  );
  let toExecute = !isAgentMultisigExecutor
    ? []
    : proposalTxs.multisigTxs.filter(
        (mt) =>
          mt.confirmations?.some((c) => c.owner == agentSigner) &&
          mt.confirmationsRequired == mt.confirmations.length,
      );

  return { toConfirm, toExecute };
};
