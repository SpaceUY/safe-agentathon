import { Injectable } from '@nestjs/common';
import Safe from '@safe-global/protocol-kit';
import { SafeMultisigTransactionResponse } from '@safe-global/types-kit';
import SafeApiKit from '@safe-global/api-kit';

export type MultisigTransaction = SafeMultisigTransactionResponse;

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

  public async getLatestProposalTransaction(params: {
    multisig: string;
    chainId: string;
    rpcUrl: string;
  }): Promise<MultisigTransaction | undefined> {
    const { multisig, chainId } = params;
    const apiKit = new SafeApiKit({
      chainId: BigInt(chainId),
    });
    const pendingTransactions = await apiKit.getPendingTransactions(multisig);
    if (pendingTransactions.count > 0) {
      const pendingTransactionsSortedBySubmissionDate =
        pendingTransactions.results.sort(
          (a, b) =>
            new Date(b.submissionDate).getTime() -
            new Date(a.submissionDate).getTime(),
        );
      return pendingTransactionsSortedBySubmissionDate[0];
    }
  }

  public async confirmProposedTransaction(params: {
    multisig: string;
    rpcUrl: string;
    chainId: string;
    proposedTx: MultisigTransaction;
    //This signer here needs to be removed and solved differently
    //to support using MPC services for example instead of a key in memory
    signerKey: string;
  }): Promise<void> {
    const { rpcUrl, chainId, multisig, signerKey, proposedTx } = params;
    const apiKit = new SafeApiKit({
      chainId: BigInt(chainId),
    });
    const safeWalletForMain: Safe = await Safe.init({
      provider: rpcUrl,
      safeAddress: multisig,
      signer: signerKey,
    });
    const signature = await safeWalletForMain.signHash(proposedTx.safeTxHash);
    await apiKit.confirmTransaction(proposedTx.safeTxHash, signature.data);
  }
  public async execProposedTransaction(params: {
    multisig: string;
    rpcUrl: string;
    proposedTx: MultisigTransaction;
    //This signer here needs to be removed and solved differently
    //to support using MPC services for example instead of a key in memory
    signerKey: string;
  }): Promise<void> {
    const { rpcUrl, multisig, signerKey, proposedTx } = params;
    const safeWalletForMain: Safe = await Safe.init({
      provider: rpcUrl,
      safeAddress: multisig,
      signer: signerKey,
    });
    await safeWalletForMain.executeTransaction(proposedTx);
  }
}
