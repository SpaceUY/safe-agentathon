export interface IAgentInteractionServiceInterface<T, S> {
  performInteraction(param: T): Promise<S>;
}
