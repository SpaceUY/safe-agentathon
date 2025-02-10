import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
dotenv.config();

export const rpcs = {
  base_testnet: `https://84532.rpc.thirdweb.com`,
  sepolia_testnet: `https://11155111.rpc.thirdweb.com`,
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
      sepolia_testnet: process.env.ETHERS_SEPOLIA_API_KEY!,
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
      {
        network: "sepolia_testnet",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io/",
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
    sepolia_testnet: {
      chainId: 11155111,
      url: rpcs.sepolia_testnet,
      accounts: [process.env.MAIN_ACCOUNT_KEY!],
    },
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
