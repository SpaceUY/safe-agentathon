export interface IAgentSignerService {
  createSigner(): Promise<string>;
  getSignerAddress(): Promise<string>;
  //This getSigner here needs to be removed and solved differently
  //to support using MPC services for example instead of a key in memory
  getSignerKey(): Promise<string>;
}
