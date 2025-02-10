import { Injectable } from '@nestjs/common';
import Safe from '@safe-global/protocol-kit';
import { SafeMultisigTransactionResponse } from '@safe-global/types-kit';
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
  }): Promise<SafeMultisigTransactionResponse | undefined> {
    const { multisig, chainId } = params;
    const apiKit = new SafeApiKit({
      chainId: BigInt(chainId),
    });
    const pendingTransactions = await apiKit.getPendingTransactions(multisig);
    if (pendingTransactions.count > 0) return pendingTransactions.results[0];
  }
}
