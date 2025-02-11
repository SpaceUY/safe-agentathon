import { env } from 'src/_common/config';
import { IAgentSignerService } from './agent-signer.service.interface';
import { ethers } from 'ethers';

export class AgentLocalSignerService implements IAgentSignerService {
  async createSigner(): Promise<string> {
    //TODO: Create a signer instead of using a signer passed in the config
    return this.getSignerAddress();
  }
  async getSignerAddress(): Promise<string> {
    const wallet = new ethers.Wallet(env.AGENT_PRIVATEKEY);
    return wallet.address;
  }
  signTransaction(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
