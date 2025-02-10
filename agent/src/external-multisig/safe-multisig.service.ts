import { Injectable } from '@nestjs/common';
import Safe from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';

@Injectable()
export class SafeMultisigService {
  public async getSafe(params: {
    multisig: string;
    rpcUrl: string;
  }): Promise<Safe> {
    const { multisig, rpcUrl } = params;
    return await Safe.init({
      provider: rpcUrl,
      safeAddress: multisig,
    });
  }

  public async getProposedTransaction(params: {
    multisig: string;
    chainId: string;
    rpcUrl: string;
  }): Promise<string> {
    const { multisig, chainId, rpcUrl } = params;
    const apiKit = new SafeApiKit({
      chainId: BigInt(chainId),
    });
    const pendingTransactions = await apiKit.getPendingTransactions(multisig);
    const transaction = pendingTransactions.results[0];
    return JSON.stringify(transaction);
  }
}
