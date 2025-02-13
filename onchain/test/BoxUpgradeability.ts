import hre from "hardhat";
import BoxProxyModule from "../ignition/modules/BoxProxy";
import { Box, BoxV2 } from "../typechain-types";
import BoxV2Module from "../ignition/modules/BoxV2";
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { SafeEthersSigner } from "@safe-global/safe-ethers-adapters";

describe("BoxUpgradeability", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  const MAIN_ACCOUNT_ADDRESS = new hre.ethers.Wallet(
    process.env.MAIN_ACCOUNT_KEY!
  ).address;
  const SECONDARY_ACCOUNT_ADDRESS = new hre.ethers.Wallet(
    process.env.SECONDARY_ACCOUNT_KEY!
  ).address;

  async function getBoxProxyV1(multisig: string): Promise<Box> {
    const boxProxy = await hre.ignition.deploy(BoxProxyModule, {
      parameters: {
        multisig,
      } as any,
    });
    const boxImpl = await hre.ethers.getContractFactory("Box");
    const box = boxImpl.attach(await boxProxy.proxy.getAddress());
    return box as Box;
  }
  async function getBoxV2DeployedAddress(): Promise<string> {
    const boxV2 = (await hre.ignition.deploy(BoxV2Module)).box;
    return await boxV2.getAddress();
  }
  async function getBoxV2Proxy(boxProxy: Box): Promise<BoxV2> {
    const boxImpl = await hre.ethers.getContractFactory("BoxV2");
    const box = boxImpl.attach(await boxProxy.getAddress());
    return box as BoxV2;
  }
  async function getContractsToProposeUpgrade() {
    const isLocal =
      hre.network.name == "hardhat" || hre.network.name == "localhost";
    if (isLocal) {
      throw new Error(
        "Safe and localnet requieres a multisend contract making thing more complex"
      );
    }
    const rpcUrl = (hre.config.networks[hre.network.name] as any).url;
    const multisig = process.env.MULTISIG!;
    const boxProxy = await getBoxProxyV1(multisig);
    const boxProxyAddress = await boxProxy.getAddress();
    const boxV2DeployedAddress = await getBoxV2DeployedAddress();

    const apiKit = new SafeApiKit({
      chainId: BigInt(hre.network.config.chainId!),
    });

    return {
      boxProxy,
      boxProxyAddress,
      boxV2DeployedAddress,
      multisig,
      rpcUrl,
      apiKit,
    };
  }

  describe("Deployment", function () {
    it.skip("Should upgrade successfully", async function () {
      const {
        boxProxy,
        boxProxyAddress,
        boxV2DeployedAddress,
        multisig,
        rpcUrl,
        apiKit,
      } = await getContractsToProposeUpgrade();
      //--PROPOSE
      const safeWalletForSecondary: Safe = await Safe.init({
        provider: rpcUrl,
        safeAddress: multisig,
        signer: process.env.SECONDARY_ACCOUNT_KEY!,
      });
      const tx = await boxProxy
        .getFunction("upgradeToAndCall")
        .populateTransaction(boxV2DeployedAddress, "0x");
      const safeTx = await safeWalletForSecondary.createTransaction({
        transactions: [
          {
            to: boxProxyAddress,
            data: tx.data,
            value: "0",
          },
        ],
      });
      const safeTxHash = await safeWalletForSecondary.getTransactionHash(
        safeTx
      );
      const signature = await safeWalletForSecondary.signHash(safeTxHash);
      await apiKit.proposeTransaction({
        safeAddress: multisig,
        safeTransactionData: safeTx.data,
        safeTxHash,
        senderSignature: signature.data,
        senderAddress: SECONDARY_ACCOUNT_ADDRESS,
      });
      //--CONFIRM
      const safeWalletForMain: Safe = await Safe.init({
        provider: rpcUrl,
        safeAddress: multisig,
        signer: process.env.MAIN_ACCOUNT_KEY!,
      });
      const pendingTransactions = await apiKit.getPendingTransactions(multisig);
      const transaction = pendingTransactions.results[0];
      await safeWalletForMain.executeTransaction(transaction);
      //---VERIFY
      const boxProxyV2 = await getBoxV2Proxy(boxProxy);
      const version = await boxProxyV2.boxVersion();
      console.log(version);
    });
    // it("Should upgrade successfully", async function () {
    //   const boxImpl = await hre.ethers.getContractFactory("BoxV2");
    //   const box = boxImpl.attach("0x298C534773A08Ff0e30211163a569f42b0789E98");
    //   console.log(box);
    //   console.log(await (box as BoxV2).boxVersion());
    //   return box as BoxV2;
    // });

    //https://help.safe.global/en/articles/235770-proposers
    it.skip("Propose transfer with proposer", async function () {
      const multisig = process.env.MULTISIG!;
      const rpcUrl = (hre.config.networks[hre.network.name] as any).url;
      //0x02ac83F5c6Af46FF26a3E2F8AFF82C62B6286d47
      const proposerWallet = new hre.ethers.Wallet(
        "0x242ab6f7c55750585d8dcf953ab6ee4ab7f08ca87551a4a20571c25ec949df81",
        new hre.ethers.JsonRpcProvider(rpcUrl)
      );
      const safeWallet: Safe = await Safe.init({
        provider: rpcUrl,
        safeAddress: multisig,
        signer: proposerWallet.privateKey,
      });
      const safeTx = await safeWallet.createTransaction({
        transactions: [
          {
            to: proposerWallet.address,
            data: "0x",
            value: "1", // hre.ethers.parseEther("0.1").toString(),
          },
        ],
      });
      const safeTxHash = await safeWallet.getTransactionHash(safeTx);
      const apiKit = new SafeApiKit({
        chainId: BigInt(hre.network.config.chainId!),
      });
      const signature = await safeWallet.signHash(safeTxHash);
      await apiKit.proposeTransaction({
        safeAddress: multisig,
        safeTransactionData: safeTx.data,
        safeTxHash,
        senderSignature: signature.data,
        senderAddress: proposerWallet.address,
      });

      console.log("Transaction proposed with hash:", safeTxHash);
    });

    it("Propose upgrade with proposer", async function () {
      const {
        boxProxy,
        boxProxyAddress,
        boxV2DeployedAddress,
        multisig,
        rpcUrl,
        apiKit,
      } = await getContractsToProposeUpgrade();
      //0x02ac83F5c6Af46FF26a3E2F8AFF82C62B6286d47
      const proposerWallet = new hre.ethers.Wallet(
        "0x242ab6f7c55750585d8dcf953ab6ee4ab7f08ca87551a4a20571c25ec949df81",
        new hre.ethers.JsonRpcProvider(rpcUrl)
      );
      const safeWallet: Safe = await Safe.init({
        provider: rpcUrl,
        safeAddress: multisig,
        signer: proposerWallet.privateKey,
      });
      const tx = await boxProxy
        .getFunction("upgradeToAndCall")
        .populateTransaction(boxV2DeployedAddress, "0x");
      const safeTx = await safeWallet.createTransaction({
        transactions: [
          {
            to: boxProxyAddress,
            data: tx.data,
            value: "0",
          },
        ],
      });
      const safeTxHash = await safeWallet.getTransactionHash(safeTx);
      const signature = await safeWallet.signHash(safeTxHash);
      await apiKit.proposeTransaction({
        safeAddress: multisig,
        safeTransactionData: safeTx.data,
        safeTxHash,
        senderSignature: signature.data,
        senderAddress: proposerWallet.address,
      });

      console.log("Transaction proposed with hash:", safeTxHash);
    });
  });
});
