import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
dotenv.config();

export const rpcs = {
  base_testnet: `https://84532.rpc.thirdweb.com`,
};

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  ignition: {
    strategyConfig: {
      create2: {
        salt: "0x0000000000000000000000000000160000000000000000000000000000000000",
      },
    },
  },
  etherscan: {
    apiKey: {
      base_testnet: process.env.ETHERS_BASE_API_KEY!,
    },
    customChains: [
      {
        network: "base_testnet",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
    ],
  },
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: process.env.MAIN_ACCOUNT_KEY!,
          balance: "10000000000000000000000",
        },
      ],
    },
    base_testnet: {
      chainId: 84532,
      url: rpcs.base_testnet,
      accounts: [process.env.MAIN_ACCOUNT_KEY!],
    },
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
