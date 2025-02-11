export interface IAgentLocalSignerService {
  createSigner(): Promise<string>;
  getSignerAddress(): Promise<string>;
  signTransaction(): Promise<string>;
}
