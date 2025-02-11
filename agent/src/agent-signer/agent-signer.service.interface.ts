export interface IAgentSignerService {
  createSigner(): Promise<string>;
  getSignerAddress(): Promise<string>;
  signTransaction(): Promise<string>;
}
