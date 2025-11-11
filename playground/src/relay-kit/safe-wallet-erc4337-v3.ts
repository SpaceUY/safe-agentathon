import dotenv from "dotenv";
dotenv.config();

import { Safe4337Pack, SafeOperationFactory, createUserOperation } from '@safe-global/relay-kit';
import { ethers } from 'ethers';
//import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "@safe-global/relay-kit/dist/src/packs/safe-4337/constants";
const ENTRYPOINT_ADDRESS_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
const ENTRYPOINT_ADDRESS_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'

//RECORDAR:
//Fondear sender
//Fondear safe (antes predecirla), al menos 1 wei que es lo que se transfiere al llamar transferFromSafe
//Cambiar salt si se quiere usar una billetera nueva

// Safe deployment configuration (from index.ts)
const salt = "0x12345678912390";
const safeVersion = "1.4.1";
const deploymentType = "canonical";

// Helper function to serialize BigInt values in JSON
function jsonStringifyWithBigInt(obj: any, space?: number | string): string {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    },
    space
  );
}

// Helper function to convert user operation numeric fields to hex strings
// ERC-4337 bundlers expect numeric fields as hex strings (0x...)
function convertUserOperationToHex(userOp: any): any {
  const numericFields = [
    'nonce',
    'callGasLimit',
    'verificationGasLimit',
    'preVerificationGas',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
  ];

  const converted = { ...userOp };
  
  for (const field of numericFields) {
    if (field in converted && converted[field] !== undefined && converted[field] !== null) {
      const value = converted[field];
      // Convert if it's a number, BigInt, or numeric string (not already hex)
      if (typeof value === 'bigint') {
        converted[field] = '0x' + value.toString(16);
      } else if (typeof value === 'number') {
        converted[field] = '0x' + value.toString(16);
      } else if (typeof value === 'string') {
        if (value.startsWith('0x')) {
          // Already hex, leave as is
          // No conversion needed
        } else if (value === '' || value === '0') {
          // Empty string or "0" should be "0x0"
          converted[field] = '0x0';
        } else {
          // It's a decimal string, convert to hex
          try {
            const numValue = BigInt(value);
            converted[field] = '0x' + numValue.toString(16);
          } catch (e) {
            // If conversion fails, leave as is
            console.warn(`Could not convert ${field} value "${value}" to hex, leaving as is`);
          }
        }
      }
    }
  }
  
  return converted;
}

function ensureGasFees(feeData: ethers.FeeData): {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
} {
  const minPriorityFeePerGas = 30_000_000_000n; // 30 gwei
  const minMaxFeePerGas = 30_000_000_000n; // 30 gwei

  let maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? minMaxFeePerGas;
  let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? minPriorityFeePerGas;

  if (maxPriorityFeePerGas < minPriorityFeePerGas) {
    maxPriorityFeePerGas = minPriorityFeePerGas;
  }
  if (maxFeePerGas < minMaxFeePerGas) {
    maxFeePerGas = minMaxFeePerGas;
  }
  if (maxFeePerGas < maxPriorityFeePerGas) {
    maxFeePerGas = maxPriorityFeePerGas;
  }

  return { maxFeePerGas, maxPriorityFeePerGas };
}

function createFeeEstimatorForAlchemy({
  bundlerUrl,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  bundlerUrl: string;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}) {
  return {
    preEstimateUserOperationGas: async (props: any) => {
      const sourceUserOp = props.userOperation;
      const userOpPayload: any = {
        sender: sourceUserOp.sender,
        nonce: sourceUserOp.nonce,
        ...(sourceUserOp.initCode ? { initCode: sourceUserOp.initCode } : {}),
        ...(sourceUserOp.factory && sourceUserOp.factoryData ? { factory: sourceUserOp.factory, factoryData: sourceUserOp.factoryData } : {}),
        callData: sourceUserOp.callData,
        verificationGasLimit: sourceUserOp.verificationGasLimit,
        preVerificationGas: sourceUserOp.preVerificationGas,
        signature: sourceUserOp.signature,
      };
      // Use standard ERC-4337 gas estimation via the bundler
      // The bundler should handle this using eth_estimateUserOperationGas
      // Return the gas data from the bundler
      
      // Convert user operation numeric fields to hex strings
      const userOpHex = convertUserOperationToHex(userOpPayload);
      
      // Ensure gas prices are set correctly (override if too low)
      userOpHex.maxFeePerGas = '0x' + maxFeePerGas.toString(16);
      userOpHex.maxPriorityFeePerGas = '0x' + maxPriorityFeePerGas.toString(16);
      
      const requestBody = {
        jsonrpc: '2.0',
        method: 'eth_estimateUserOperationGas',
        params: [userOpHex, props.entryPoint],
        id: 1,
      };
      
      console.log("=== Request to Bundler ===");
      console.log("Original userOp:", jsonStringifyWithBigInt(props.userOperation, 2));
      console.log("Converted userOp:", jsonStringifyWithBigInt(userOpHex, 2));
      console.log("Entry Point:", props.entryPoint);
      console.log("Request body:", jsonStringifyWithBigInt(requestBody, 2));
      console.log("==========================");
      
      const response = await fetch(props.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStringifyWithBigInt(requestBody),
      });
      
      const result: any = await response.json();

      console.log("=== Bundler Response ===");
      console.log("Result:", jsonStringifyWithBigInt(result, 2));
      console.log("=======================");
      if (result.error) {
        throw new Error(result.error.message || 'Gas estimation failed');
      }
      
      // Add buffer to gas values to account for bundler requirements
      // Convert hex strings to BigInt, add buffer, then convert back to hex
      const addBuffer = (value: string, bufferPercent: number = 5, minBuffer: number = 1000): string => {
        // Remove '0x' prefix if present
        const hexValue = value.startsWith('0x') ? value.slice(2) : value;
        const numValue = BigInt('0x' + hexValue);
        // Add percentage buffer (at least minBuffer)
        const buffer = numValue * BigInt(bufferPercent) / BigInt(100);
        const minBufferBigInt = BigInt(minBuffer);
        const finalBuffer = buffer > minBufferBigInt ? buffer : minBufferBigInt;
        const finalValue = numValue + finalBuffer;
        return '0x' + finalValue.toString(16);
      };
      
      const callGasLimit = addBuffer(result.result.callGasLimit, 5, 1000);
      const verificationGasLimit = addBuffer(result.result.verificationGasLimit, 5, 1000);
      const preVerificationGas = addBuffer(result.result.preVerificationGas, 5, 1000);
      
      console.log("=== Gas Values with Buffer ===");
      console.log(`callGasLimit: ${result.result.callGasLimit} -> ${callGasLimit}`);
      console.log(`verificationGasLimit: ${result.result.verificationGasLimit} -> ${verificationGasLimit}`);
      console.log(`preVerificationGas: ${result.result.preVerificationGas} -> ${preVerificationGas}`);
      console.log("==============================");
      
      return {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
      };
    },
    postEstimateUserOperationGas: async (props: any) => {
      // After gas estimation, ensure gas prices are set correctly
      const userOp = props.userOperation as any;
      
      // Update gas prices if they're too low
      if (userOp.maxFeePerGas) {
        const currentMaxFee = BigInt(userOp.maxFeePerGas);
        if (currentMaxFee < maxFeePerGas) {
          userOp.maxFeePerGas = '0x' + maxFeePerGas.toString(16);
        }
      } else {
        userOp.maxFeePerGas = '0x' + maxFeePerGas.toString(16);
      }
      
      if (userOp.maxPriorityFeePerGas) {
        const currentMaxPriority = BigInt(userOp.maxPriorityFeePerGas);
        if (currentMaxPriority < maxPriorityFeePerGas) {
          userOp.maxPriorityFeePerGas = '0x' + maxPriorityFeePerGas.toString(16);
        }
      } else {
        userOp.maxPriorityFeePerGas = '0x' + maxPriorityFeePerGas.toString(16);
      }
      
      return userOp;
    },
  };
}

function createFeeEstimatorForGelato({
  bundlerUrl,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  bundlerUrl: string;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}) {
  return {
    preEstimateUserOperationGas: async (props: any) => {
      const sourceUserOp = props.userOperation;
      const userOpPayload: any = {
        sender: sourceUserOp.sender,
        nonce: sourceUserOp.nonce,
        ...(sourceUserOp.initCode ? { initCode: sourceUserOp.initCode } : {}),
        ...(sourceUserOp.factory && sourceUserOp.factoryData ? { factory: sourceUserOp.factory, factoryData: sourceUserOp.factoryData } : {}),
        callData: sourceUserOp.callData,
        verificationGasLimit: sourceUserOp.verificationGasLimit,
        preVerificationGas: sourceUserOp.preVerificationGas,
        signature: sourceUserOp.signature,
      };

      const requestBody = {
        jsonrpc: '2.0',
        method: 'eth_estimateUserOperationGas',
        params: [userOpPayload, props.entryPoint],
        id: 1,
      };

      console.log("=== Request to Bundler ===");
      console.log("Original userOp:", jsonStringifyWithBigInt(props.userOperation, 2));
      console.log("Prepared userOp:", jsonStringifyWithBigInt(userOpPayload, 2));
      console.log("Entry Point:", props.entryPoint);
      console.log("Request body:", jsonStringifyWithBigInt(requestBody, 2));
      console.log("==========================");

      const response = await fetch(bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStringifyWithBigInt(requestBody),
      });

      const result: any = await response.json();

      console.log("=== Bundler Response ===");
      console.log("Result:", jsonStringifyWithBigInt(result, 2));
      console.log("=======================");
      if (result.error) {
        throw new Error(result.error.message || 'Gas estimation failed');
      }

      const addBuffer = (value: string, bufferPercent: number = 5, minBuffer: number = 1000): string => {
        const hexValue = value.startsWith('0x') ? value.slice(2) : value;
        const numValue = BigInt('0x' + hexValue);
        const buffer = numValue * BigInt(bufferPercent) / BigInt(100);
        const minBufferBigInt = BigInt(minBuffer);
        const finalBuffer = buffer > minBufferBigInt ? buffer : minBufferBigInt;
        const finalValue = numValue + finalBuffer;
        return '0x' + finalValue.toString(16);
      };

      const callGasLimit = addBuffer(result.result.callGasLimit, 5, 1000);
      const verificationGasLimit = addBuffer(result.result.verificationGasLimit, 5, 1000);
      const preVerificationGas = addBuffer(result.result.preVerificationGas, 5, 1000);

      console.log("=== Gas Values with Buffer ===");
      console.log(`callGasLimit: ${result.result.callGasLimit} -> ${callGasLimit}`);
      console.log(`verificationGasLimit: ${result.result.verificationGasLimit} -> ${verificationGasLimit}`);
      console.log(`preVerificationGas: ${result.result.preVerificationGas} -> ${preVerificationGas}`);
      console.log("==============================");

      return {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
      };
    },
    postEstimateUserOperationGas: async (props: any) => {
      const userOp = props.userOperation as any;
      userOp.maxFeePerGas = '0x0'
      userOp.maxPriorityFeePerGas = '0x0' 
      return userOp;
    },
  };
}

// Alchemy network names by chain ID (for bundler endpoints)
const ALCHEMY_NETWORKS: Record<string, string> = {
  '80002': 'polygon-amoy', // Polygon Amoy
  '1': 'eth-mainnet', // Ethereum Mainnet
  '11155111': 'eth-sepolia', // Sepolia
  '84532': 'base-sepolia', // Base Sepolia
  '137': 'polygon-mainnet', // Polygon Mainnet
  '42161': 'arb-mainnet', // Arbitrum Mainnet
  '421614': 'arb-sepolia', // Arbitrum Sepolia
};

//https://docs.safe.global/advanced/smart-account-supported-networks
//ATTENTION!! Cuando uso el bundler de gelato por alguna razon tengo que usar esto.
const SAFE_4337_CUSTOM_CONTRACTS: Record<
  string,
  {
    safe4337ModuleAddress?: string;
    safeModulesSetupAddress?: string;
    safeModulesVersion?: string;
  }
> = {
  '80002': {
    safe4337ModuleAddress: '0x75cf11467937ce3f2f357ce24ffc3dbf8fd5c226',
    safeModulesSetupAddress: '0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47',
    safeModulesVersion: '0.3.0',
  },
  // '80002': {
  //   safe4337ModuleAddress: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
  //   safeModulesSetupAddress: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
  //   safeModulesVersion: '0.2.0',
  // },
};

// Configuration
const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = process.env.CHAIN_ID!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!; // Safe owner's private key
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const GELATO_API_KEY = process.env.GELATO_API_KEY;
const alchemyNetwork = ALCHEMY_NETWORKS[CHAIN_ID];

// Build bundler URL
let BUNDLER_URL: string | undefined;

if (process.env.BUNDLER_RPC_URL) {
  BUNDLER_URL = process.env.BUNDLER_RPC_URL;
} else if (ALCHEMY_API_KEY && alchemyNetwork) {
  BUNDLER_URL = `https://${alchemyNetwork}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
} else if (GELATO_API_KEY) {
  BUNDLER_URL = `https://api.gelato.digital/bundlers/${CHAIN_ID}/rpc?apiKey=${GELATO_API_KEY}&sponsored=false`; 
}

let PAYMASTER_URL: string | undefined;

if (GELATO_API_KEY) {
  PAYMASTER_URL = BUNDLER_URL;//`https://api.gelato.digital/bundlers/${CHAIN_ID}/rpc?apiKey=${GELATO_API_KEY}&sponsored=false`; 
}

// Transfer configuration
const transferTo = process.env.TRANSFER_TO || "0x26aCB57e5ee79342e959b50475455Df2C2018A37";
const transferAmount = 1n;

const chainConfig = SAFE_4337_CUSTOM_CONTRACTS[CHAIN_ID];
const customContracts = chainConfig
  ? {
      ...(chainConfig.safe4337ModuleAddress
        ? { safe4337ModuleAddress: chainConfig.safe4337ModuleAddress }
        : {}),
      ...(chainConfig.safeModulesSetupAddress
        ? { safeModulesSetupAddress: chainConfig.safeModulesSetupAddress }
        : {}),
    }
  : undefined;
const safeModulesVersion = chainConfig?.safeModulesVersion;

/**
 * Predicts the Safe wallet address using Safe4337Pack
 * @returns The predicted Safe address
 */
export async function predictSafe(): Promise<string> {
  console.log('🔮 Safe Wallet Address Predictor');
  console.log('==================================\n');

  try {
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('📋 Configuration:');
    console.log(`   Owner Address: ${wallet.address}`);
    console.log(`   Chain ID: ${CHAIN_ID}`);
    console.log(`   Salt: ${salt}`);
    console.log(`   Safe Version: ${safeVersion}`);
    console.log(`   Deployment Type: ${deploymentType}\n`);

    if (!BUNDLER_URL) {
      throw new Error(
        `Cannot determine bundler URL. Either provide BUNDLER_RPC_URL or set ALCHEMY_API_KEY and use a supported network. ` +
        `Chain ID: ${CHAIN_ID}, Alchemy Network: ${alchemyNetwork || 'NOT FOUND'}`
      );
    }

    // Initialize Safe4337Pack
    console.log('📦 Initializing Safe4337Pack...', RPC_URL, BUNDLER_URL);
    const safe4337Pack = await Safe4337Pack.init({
      provider: RPC_URL,
      bundlerUrl: BUNDLER_URL,
      ...(safeModulesVersion ? { safeModulesVersion } : {}),
      ...(customContracts ? { customContracts } : {}),
      options: {
        owners: [wallet.address],
        threshold: 1,
        saltNonce: salt,
        safeVersion: safeVersion,
        deploymentType: deploymentType as any,
      },
      //...(PAYMASTER_URL ? { paymasterOptions: { paymasterUrl: PAYMASTER_URL, isSponsored: true } } : {})
    });

    console.log('✅ Safe4337Pack initialized\n');
    
    // Get the predicted Safe address from the internal protocolKit
    // Safe4337Pack uses protocolKit internally which has getAddress()
    const predictedAddress = await (safe4337Pack as any).protocolKit?.getAddress();
    
    if (!predictedAddress) {
      throw new Error('Could not get Safe address from Safe4337Pack');
    }

    console.log('📍 Predicted Safe Address:');
    console.log(`   ${predictedAddress}\n`);

    // Check if Safe is already deployed
    const providerInstance = new ethers.JsonRpcProvider(RPC_URL);
    const code = await providerInstance.getCode(predictedAddress);
    const isDeployed = code !== '0x';

    console.log(`📊 Deployment Status: ${isDeployed ? '✅ Already Deployed' : '❌ Not Deployed'}\n`);

    console.log('✨ Prediction completed!\n');

    return predictedAddress;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

/**
 * Executes a user operation using Safe4337Pack
 * @param transactions - Array of transactions to execute
 * @returns The user operation hash
 */
export async function execute(transactions?: Array<{ to: string; value: string; data: string }>): Promise<string> {
  console.log('🚀 Safe Wallet User Operation - Using Relay Kit');
  console.log('================================================\n');

  try {
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Use provided transactions or default transfer
    const txList = transactions || [
      {
        to: transferTo,
        value: transferAmount.toString(),
        data: '0x',
      },
    ];

    console.log('📋 Configuration:');
    console.log(`   Owner Address: ${wallet.address}`);
    console.log(`   Chain ID: ${CHAIN_ID}`);
    console.log(`   Transactions: ${txList.length}`);
    console.log(`   Bundler URL: ${BUNDLER_URL || 'Not configured'}`);
    console.log(`   Alchemy Network: ${alchemyNetwork || 'Not found'}\n`);

    if (!BUNDLER_URL) {
      throw new Error(
        `Cannot determine bundler URL. Either provide BUNDLER_RPC_URL or set ALCHEMY_API_KEY and use a supported network. ` +
        `Chain ID: ${CHAIN_ID}, Alchemy Network: ${alchemyNetwork || 'NOT FOUND'}`
      );
    }

    // Initialize Safe4337Pack
    console.log('📦 Initializing Safe4337Pack...');
    const safe4337Pack = await Safe4337Pack.init({
      provider: RPC_URL,
      bundlerUrl: BUNDLER_URL,
      ...(safeModulesVersion ? { safeModulesVersion } : {}),
      ...(customContracts ? { customContracts } : {}),
      options: {
        owners: [wallet.address],
        threshold: 1,
        saltNonce: salt,
        safeVersion: safeVersion,
        deploymentType: deploymentType as any,
      },
      //
      ...(PAYMASTER_URL ? { paymasterOptions: { paymasterUrl: PAYMASTER_URL, isSponsored: true } } : {})
    });

    console.log('✅ Safe4337Pack initialized\n');
    // Create Safe transaction
    console.log('📝 Creating Safe transaction...');
    
    // Get current gas prices from the network
    console.log('⛽ Getting current gas prices from network...');
    const feeData = await provider.getFeeData();
    const { maxFeePerGas, maxPriorityFeePerGas } = ensureGasFees(feeData);

    console.log(`   maxFeePerGas: ${maxFeePerGas.toString()} (${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei)`);
    console.log(`   maxPriorityFeePerGas: ${maxPriorityFeePerGas.toString()} (${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei)\n`);

    const isAlchemyBundler = !!BUNDLER_URL && BUNDLER_URL.includes('.g.alchemy.com');
    const isGelatoBundler = !!BUNDLER_URL && BUNDLER_URL.includes('api.gelato.digital');

    let feeEstimator = undefined;
    if (isAlchemyBundler) {
      feeEstimator = createFeeEstimatorForAlchemy({
        bundlerUrl: BUNDLER_URL,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
    } else if (isGelatoBundler) {
      feeEstimator = createFeeEstimatorForGelato({
        bundlerUrl: BUNDLER_URL,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
    }

    let entryPoint: string;
    if(safeModulesVersion === '0.2.0') {
      entryPoint = ENTRYPOINT_ADDRESS_V06;
    } else {
      entryPoint = ENTRYPOINT_ADDRESS_V07;
    }

    const userOperation = await createUserOperation(safe4337Pack.protocolKit, txList, {
      entryPoint: entryPoint,
      paymasterOptions:undefined,
    });

    const safeOperation = SafeOperationFactory.createSafeOperation(userOperation, {
      chainId: BigInt(CHAIN_ID),
      moduleAddress: customContracts?.safe4337ModuleAddress || '',
      entryPoint: entryPoint,
      validUntil:undefined,
      validAfter:undefined
    })

    console.log("SAFE OPERATION", safeOperation);

    const gasEstimation = await safe4337Pack.getEstimateFee({
      safeOperation: safeOperation,
      feeEstimator: feeEstimator,
    });
    
    console.log("GAS ESTIMATION", gasEstimation);
   
    console.log('✅ Safe transaction created');
    console.log(`   Transactions: ${txList.length}\n`);
    
    // Sign the user operation with ethers (separate signing)
    console.log('✍️ Signing user operation with ethers...');
    
    // Check the safeOperation structure to understand what we have
    console.log(`   SafeOperation keys: ${JSON.stringify(Object.keys(safeOperation))}`);
    
    // Get the hash to sign from the safeOperation
    // The Safe4337Pack should provide a way to get the hash
    // Let's check if safeOperation has a method to get the hash or if the pack has one
    
    let operationHash: string = await (safeOperation as any).getHash();
    
    console.log(`   Operation Hash: ${operationHash}\n`);
    
    // Sign the hash with ethers (like we do in index.ts)
    console.log('   Signing hash with ethers...');
    const signingKey = new ethers.SigningKey(PRIVATE_KEY);
    const signature = signingKey.sign(operationHash);
    
    console.log(`   ✅ Signature created: ${signature.serialized.toString()}\n`);
    
    // Add the signature to the safeOperation
    // The safeOperation should have an addSignature method (like Safe SDK)
    const safeSignatureObj = {
      signer: wallet.address,
      data: signature.serialized.toString(),
      isContractSignature: false,
    };

    // Add signature to safeOperation using addSignature method
    safeOperation.addSignature(safeSignatureObj as any);
    console.log('✅ Signature added to safeOperation\n');
    
    // The safeOperation should now be signed
    const signedSafeOperation = safeOperation;
    
    // Submit the user operation
    console.log('📡 Submitting user operation to bundler...');
    const userOperationHash = await safe4337Pack.executeTransaction({
      executable: signedSafeOperation
    });
    
    console.log('✅ User operation submitted!');
    console.log(`   UserOp Hash: ${userOperationHash}\n`);
    
    // Check transaction status
    console.log('⏳ Waiting for transaction to be mined...');
    let userOperationReceipt = null;
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 60 seconds (30 * 2 seconds)
    
    while (!userOperationReceipt && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
      
      try {
        userOperationReceipt = await safe4337Pack.getUserOperationReceipt(
          userOperationHash
        );
        
        if (userOperationReceipt) {
          console.log('✅ Transaction confirmed!');
          console.log(`   Receipt: ${jsonStringifyWithBigInt(userOperationReceipt, 2)}\n`);
          break;
        }
      } catch (error: any) {
        // Receipt not ready yet, continue waiting
        if (attempts % 5 === 0) {
          console.log(`   Still waiting... (attempt ${attempts}/${maxAttempts})`);
        }
      }
    }
    
    if (!userOperationReceipt) {
      console.log('⚠️  Transaction receipt not available yet');
      console.log(`   UserOp Hash: ${userOperationHash}`);
      console.log(`   You can check the status manually using the bundler API\n`);
    }
    
    // Get user operation details
    try {
      console.log('🔍 Getting user operation details...');
      const userOperationPayload = await safe4337Pack.getUserOperationByHash(
        userOperationHash
      );
      
      if (userOperationPayload) {
        console.log('✅ User operation details retrieved');
        console.log(`   Payload: ${jsonStringifyWithBigInt(userOperationPayload, 2)}\n`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  Could not retrieve user operation details: ${error.message}\n`);
    }
    
    console.log('✨ User operation completed!\n');

    return userOperationHash;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

//predictSafe()
execute()
  .then(() => {
    console.log('\n✨ Playground completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

