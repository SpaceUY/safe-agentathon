import { Injectable } from '@nestjs/common';
import { ProposalTxs } from '../agent-checks/agent-checks.service.interface';
import {
  AgentState,
  IAgentStateService,
} from './agent-state.service.interface';

@Injectable()
export class AgentMemoryStateService implements IAgentStateService {
  private _proposalEvaluationPool: Record<
    string,
    { twoFAapproved: boolean; checksPassed: boolean }
  > = {};
  private readonly PROPOSAL_WAITING_FOR_TWO_FA_EXPIRATION_TIME_IN_SECONDS =
    60 * 5 * 1000;
  private readonly PROPOSAL_TO_EXECUTE_EXPIRATION_TIME_IN_SECONDS =
    60 * 5 * 1000;
  private _state: AgentState;
  private _twoFAConfirmedForProposal: boolean;
  private _proposalWaitingForTwoFASubmissionDateTime: number;
  private _proposalWaitingForTwoFA: ProposalTxs | undefined;
  private _proposalReadyToExecute: ProposalTxs | undefined;
  private _proposalReadyToExecuteSubmissionDateTime: number;

  public get state() {
    return this._state;
  }
  public set state(state: AgentState) {
    this._state = state;
  }

  public registerIntoProposalEvaluationPool(
    proposalIdentificator: string,
    config?:
      | {
          twoFAapproved?: boolean | undefined;
          checksPassed?: boolean | undefined;
        }
      | undefined,
  ): { twoFAapproved: boolean; checksPassed: boolean } {
    if (!this._proposalEvaluationPool[proposalIdentificator]) {
      this._proposalEvaluationPool[proposalIdentificator] = {
        twoFAapproved: false,
        checksPassed: false,
      };
    }

    if (config?.twoFAapproved != undefined) {
      this._proposalEvaluationPool[proposalIdentificator].twoFAapproved =
        config.twoFAapproved;
    }

    if (config?.checksPassed != undefined) {
      this._proposalEvaluationPool[proposalIdentificator].checksPassed =
        config.checksPassed;
    }

    return this._proposalEvaluationPool[proposalIdentificator];
  }

  public getFromProposalEvaluationPool(
    proposalIdentificator: string,
  ): { twoFAapproved: boolean; checksPassed: boolean } | undefined {
    return this._proposalEvaluationPool[proposalIdentificator] ?? undefined;
  }

  public addProposalForTwoFAConfirmation(
    proposalWaitingForTwoFA: ProposalTxs,
  ): void {
    this._twoFAConfirmedForProposal = false;
    this._proposalWaitingForTwoFASubmissionDateTime = Date.now();
    this._proposalWaitingForTwoFA = proposalWaitingForTwoFA;
  }

  public _getProposalWaitingForTwoFA(): ProposalTxs | undefined {
    const proposal =
      this._proposalWaitingForTwoFASubmissionDateTime +
        this.PROPOSAL_WAITING_FOR_TWO_FA_EXPIRATION_TIME_IN_SECONDS >
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

  public addProposalReadyToExecute(proposal: ProposalTxs): void {
    this._proposalReadyToExecute = proposal;
    this._proposalReadyToExecuteSubmissionDateTime = Date.now();
  }

  public getProposalReadyToExecute(): ProposalTxs | undefined {
    const proposal =
      this._proposalReadyToExecuteSubmissionDateTime +
        this.PROPOSAL_TO_EXECUTE_EXPIRATION_TIME_IN_SECONDS >
      Date.now()
        ? this._proposalReadyToExecute
        : undefined;

    return proposal;
  }
}
