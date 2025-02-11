import { ProposalTx } from './agent-checks/agent-checks.service.interface';

export enum AgentState {
  IDLE,
  PROCESSING,
  WAITING_FOR_TWO_FA,
  EXECUTING,
}
export class AgentStateService {
  private readonly PROPOSAL_WAITING_FOR_TWO_FA_EXPIRATION_TIME_IN_SECONDS =
    60 * 5 * 1000;
  private readonly PROPOSAL_TO_EXECUTE_MAX_ATTEMPTS = 10;
  private _state: AgentState;
  private _twoFAConfirmedForProposal: boolean;
  private _proposalWaitingForTwoFASubmissionDateTime: number;
  private _proposalWaitingForTwoFA: ProposalTx | undefined;
  private _proposalToExecute: ProposalTx | undefined;
  private _proposalToExecuteAttempts: number = 0;
  public get state() {
    return this._state;
  }
  public set state(state: AgentState) {
    this._state = state;
  }

  public addForTwoFAConfirmation(proposalWaitingForTwoFA: ProposalTx): void {
    this._twoFAConfirmedForProposal = false;
    this._proposalWaitingForTwoFASubmissionDateTime = Date.now();
    this._proposalWaitingForTwoFA = proposalWaitingForTwoFA;
  }

  public _getProposalWaitingForTwoFA(): ProposalTx | undefined {
    const proposal =
      this._proposalWaitingForTwoFASubmissionDateTime +
        this.PROPOSAL_WAITING_FOR_TWO_FA_EXPIRATION_TIME_IN_SECONDS <
      Date.now()
        ? this._proposalWaitingForTwoFA
        : undefined;
    if (!proposal) {
      this._twoFAConfirmedForProposal = false;
      this._proposalWaitingForTwoFASubmissionDateTime = 0;
      this._proposalWaitingForTwoFA = undefined;
    }
    return proposal;
  }

  public getProposalWaitingForTwoFA(): ProposalTx | undefined {
    return this._twoFAConfirmedForProposal
      ? this._getProposalWaitingForTwoFA()
      : undefined;
  }

  public isThereAProposalWaitingForTwoFA(): boolean {
    return !!this._getProposalWaitingForTwoFA();
  }

  public confirmTwoFA() {
    this._twoFAConfirmedForProposal = true;
  }

  public addProposalToExecute(proposalToExecute: ProposalTx): void {
    this._proposalToExecute = proposalToExecute;
    this._proposalToExecuteAttempts = this.PROPOSAL_TO_EXECUTE_MAX_ATTEMPTS;
  }

  public getProposalToExecute(): ProposalTx | undefined {
    this._proposalToExecuteAttempts--;
    if (this._proposalToExecuteAttempts <= 0)
      this._proposalToExecute = undefined;
    return this._proposalToExecute;
  }
}
