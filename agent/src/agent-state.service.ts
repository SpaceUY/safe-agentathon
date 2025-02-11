import { ProposalTx } from './agent-checks/agent-checks.service.interface';

export enum AgentState {
  IDLE,
  PROCESSING,
  WAITING_FOR_TWO_FA,
}
export class AgentStateService {
  private _state: AgentState;
  private _twoFAConfirmedForProposal: boolean;
  private _proposalWaitingForTwoFASubmissionDateTime: number;
  private _proposalWaitingForTwoFA: ProposalTx;
  public get state() {
    return this._state;
  }
  public set state(state: AgentState) {
    this._state = state;
  }

  public _getProposalWaitingForTwoFA(): ProposalTx | undefined {
    return this._proposalWaitingForTwoFASubmissionDateTime + 60 * 5 * 1000 <
      Date.now()
      ? this._proposalWaitingForTwoFA
      : undefined;
  }

  public isThereAProposalWaitingForTwoFA(): boolean {
    return !!this._getProposalWaitingForTwoFA();
  }

  public addForTwoFAConfirmation(proposalWaitingForTwoFA: ProposalTx): void {
    this._twoFAConfirmedForProposal = false;
    this._proposalWaitingForTwoFASubmissionDateTime = Date.now();
    this._proposalWaitingForTwoFA = proposalWaitingForTwoFA;
  }
  public getProposalWaitingForTwoFA(): ProposalTx | undefined {
    return this._getProposalWaitingForTwoFA();
  }
}
