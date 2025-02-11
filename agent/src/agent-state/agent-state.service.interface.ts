import { ProposalTxs } from 'src/agent-checks/agent-checks.service.interface';

export enum AgentState {
  IDLE,
  PROCESSING,
  WAITING_FOR_TWO_FA,
  EXECUTING,
}
export interface IAgentStateService {
  get state(): AgentState;
  set state(value: AgentState);
  addForTwoFAConfirmation(proposalWaitingForTwoFA: ProposalTxs): void;
  getProposalWaitingForTwoFA(): ProposalTxs | undefined;
  isThereAProposalWaitingForTwoFA(): boolean;
  confirmTwoFA(): void;
  addProposal(proposal: ProposalTxs): void;
  getProposal(): ProposalTxs | undefined;
}
