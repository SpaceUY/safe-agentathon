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
  registerIntoProposalEvaluationPool(
    proposalIdentificator: string,
    config?:
      | {
          twoFAapproved?: boolean | undefined;
          checksPassed?: boolean | undefined;
        }
      | undefined,
  ): { twoFAapproved: boolean; checksPassed: boolean };
  getFromProposalEvaluationPool(
    proposalIdentificator: string,
  ): { twoFAapproved: boolean; checksPassed: boolean } | undefined;
  addProposalForTwoFAConfirmation(proposalWaitingForTwoFA: ProposalTxs): void;
  getProposalWaitingForTwoFA(): ProposalTxs | undefined;
  isThereAProposalWaitingForTwoFA(): boolean;
  confirmTwoFA(): void;
  addProposalReadyToExecute(proposal: ProposalTxs): void;
  getProposalReadyToExecute(): ProposalTxs | undefined;
}
