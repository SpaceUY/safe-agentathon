import { Injectable } from '@nestjs/common';
import { ProposalTxs } from '../agent-checks/agent-checks.service.interface';
import {
  AgentState,
  IAgentStateService,
} from './agent-state.service.interface';

@Injectable()
export class AgentMemoryStateService implements IAgentStateService {
  private readonly PROPOSAL_WAITING_FOR_TWO_FA_EXPIRATION_TIME_IN_SECONDS =
    60 * 5 * 1000;
  private readonly PROPOSAL_TO_EXECUTE_MAX_ATTEMPTS = 10;
  private _state: AgentState;
  private _twoFAConfirmedForProposal: boolean;
  private _proposalWaitingForTwoFASubmissionDateTime: number;
  private _proposalWaitingForTwoFA: ProposalTxs | undefined;
  private _proposal: ProposalTxs | undefined;
  private _proposalAttempts: number = 0;
  public get state() {
    return this._state;
  }
  public set state(state: AgentState) {
    this._state = state;
  }

  public addForTwoFAConfirmation(proposalWaitingForTwoFA: ProposalTxs): void {
    this._twoFAConfirmedForProposal = false;
    this._proposalWaitingForTwoFASubmissionDateTime = Date.now();
    this._proposalWaitingForTwoFA = proposalWaitingForTwoFA;
  }

  public _getProposalWaitingForTwoFA(): ProposalTxs | undefined {
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

  public getProposalWaitingForTwoFA(): ProposalTxs | undefined {
    return this._twoFAConfirmedForProposal
      ? this._getProposalWaitingForTwoFA()
      : undefined;
  }

  public isThereAProposalWaitingForTwoFA(): boolean {
    return !!this._getProposalWaitingForTwoFA();
  }

  public confirmTwoFA(): void {
    this._twoFAConfirmedForProposal = true;
  }

  public addProposal(proposal: ProposalTxs): void {
    this._proposal = proposal;
    this._proposalAttempts = this.PROPOSAL_TO_EXECUTE_MAX_ATTEMPTS;
  }

  public getProposal(): ProposalTxs | undefined {
    this._proposalAttempts--;
    if (this._proposalAttempts <= 0) this._proposal = undefined;
    return this._proposal;
  }
}
