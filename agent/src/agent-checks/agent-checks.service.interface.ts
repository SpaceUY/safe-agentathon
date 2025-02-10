export interface IAgentCheckServiceInterface {
  performCheck(): Promise<boolean>;
}
