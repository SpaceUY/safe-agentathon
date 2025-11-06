// @ts-ignore - ESM interop with CommonJS
import SafeModule from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Handle ESM/CommonJS interop - Safe is exported as default from CommonJS
// In ESM, default import might be wrapped, so check both .default and direct
const Safe = (SafeModule as any)?.default || SafeModule;

const salt= "0x123456789";
const safeVersion= "1.4.1";
const deploymentType= "canonical";

// ERC-4337 module address (same across all chains)
const ERC4337_MODULE_ADDRESS = "0xa581c4A4DB7175302464fF3C06380BC3270b4037";

// Load environment variables
dotenv.config();

//RECORDAR:
//Fondear sender
//Fondear safe (antes predecirla), al menos 1 wei que es lo que se transfiere al llamar transferFromSafe
//Cambiar salt si se quiere usar una billetera nueva

//CHECK THE SAFE VERSION FOR THE CHAIN!!
//https://docs.safe.global/advanced/smart-account-supported-networks?page=35

async function predictSafe() {
  console.log('🔮 Safe Wallet Address Predictor (mainPredictSafe)');
  console.log('==================================================\n');

  // Example configuration - update these with your values
  const RPC_URL = process.env.RPC_URL!
  const CHAIN_ID = process.env.CHAIN_ID!
  const PRIVATE_KEY = process.env.PRIVATE_KEY!
  const SENDER_KEY = process.env.SENDER_KEY!

  try {
    // Initialize Safe Protocol Kit
    console.log('📦 Initializing Safe Protocol Kit...');

    const signer = new ethers.Wallet(PRIVATE_KEY!, new ethers.JsonRpcProvider(RPC_URL!));
    
    const safeSdk = await Safe.init({
      provider: RPC_URL,
      predictedSafe: {
        // Required: Safe account configuration
        safeAccountConfig: {
          owners: [signer.address], // Required: Array of owner addresses
          threshold: 1,        // Required: Number of signatures needed
        },
        // Optional: Deployment configuration
        safeDeploymentConfig: {
          saltNonce: salt,         // Optional: Salt nonce for deterministic address
          safeVersion: safeVersion,        // Optional: Safe version (e.g., '1.4.1')
          deploymentType: deploymentType,  // Optional: 'canonical' | 'eip155' | 'zksync'
        },
      },
    });

    console.log('✅ Safe SDK initialized\n');

    // Get the predicted Safe address
    const predictedAddress = await safeSdk.getAddress();
    
    console.log('📍 Predicted Safe Address:');
    console.log(`   ${predictedAddress}\n`);
    
    // Get Safe configuration details
    console.log('📋 Safe Configuration:');
    console.log(`   Owners: ${(await safeSdk.getOwners()).join(', ')}`);
    console.log(`   Threshold: ${await safeSdk.getThreshold()}`);
    console.log(`   Safe Version: ${safeVersion}`);
    console.log(`   Salt Nonce: ${salt}`);
    console.log(`   Deployment Type: ${deploymentType}\n`);
    
    // Check if Safe is already deployed
    const isDeployed = await safeSdk.isSafeDeployed();
    console.log(`📊 Deployment Status: ${isDeployed ? '✅ Already Deployed' : '❌ Not Deployed'}\n`);
    
    // Get init code (for reference)
    if (!isDeployed) {
      const initCode = await safeSdk.getInitCode();
      console.log(`🔧 Init Code (for reference):`);
      console.log(`   ${initCode.slice(0, 66)}...\n`);
    }
    
    console.log('✨ Prediction completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function transferFromSafe() {
  console.log('🚀 Safe Protocol Kit Playground');
  console.log('================================\n');

  // Example configuration - update these with your values
  const RPC_URL = process.env.RPC_URL!
  const CHAIN_ID = process.env.CHAIN_ID!
  const PRIVATE_KEY = process.env.PRIVATE_KEY!
  const SENDER_KEY = process.env.SENDER_KEY!

  try {
    // Initialize Safe Protocol Kit
    console.log('📦 Initializing Safe Protocol Kit...');

    const signer = new ethers.Wallet(PRIVATE_KEY!, new ethers.JsonRpcProvider(RPC_URL!));
    // Create sender wallet for signing raw blockchain transactions
    const senderWallet = new ethers.Wallet(SENDER_KEY!, new ethers.JsonRpcProvider(RPC_URL!));
    
    const safeSdk = await Safe.init({
      provider: RPC_URL,
      predictedSafe: {
        // Required: Safe account configuration
        safeAccountConfig: {
          owners: [signer.address], // Required: Array of owner addresses
          threshold: 1,        // Required: Number of signatures needed
        },
        // Optional: Deployment configuration
        safeDeploymentConfig: {
          saltNonce: salt,         // Optional: Salt nonce for deterministic address
          safeVersion: safeVersion,        // Optional: Safe version (e.g., '1.4.1')
          deploymentType: deploymentType,  // Optional: 'canonical' | 'eip155' | 'zksync'
        },
      },
    });

    console.log('✅ Safe SDK initialized');
    console.log(`📍 Safe Address: ${await safeSdk.getAddress()}`);
    console.log(`👥 Owners: ${(await safeSdk.getOwners()).join(', ')}`);
    console.log(`🔢 Threshold: ${await safeSdk.getThreshold()}\n`);

    const transactions = [
      {
        to: "0x26aCB57e5ee79342e959b50475455Df2C2018A37",
        value: '1', // Amount in wei
        data: '0x', // Transaction data
      },
    ]
    
    let finalTx;

    const isSafeDeployed = await safeSdk.isSafeDeployed();
    
    if(isSafeDeployed) {
      console.log('✅ Safe is already deployed');
      
      // Re-initialize SDK with safeAddress instead of predictedSafe for deployed Safe
      const deployedSafeAddress = await safeSdk.getAddress();
      console.log(`📍 Re-initializing SDK with deployed Safe address: ${deployedSafeAddress}\n`);
      
      const deployedSafeSdk = await Safe.init({
        provider: RPC_URL,
        safeAddress: deployedSafeAddress,
      });
      
      // Recreate the transaction with the deployed Safe SDK
      const safeTx = await deployedSafeSdk.createTransaction({
        transactions
      });
      
      // Step 1: Get the Safe transaction hash to sign
      console.log('📋 Getting Safe transaction hash to sign...');
      const safeTxHash = await deployedSafeSdk.getTransactionHash(safeTx);
      console.log(`   Safe Tx Hash: ${safeTxHash}\n`);
      
      // Step 2: Sign the Safe transaction hash with ethers
      console.log('✍️ Signing Safe transaction hash with ethers...');
      const signingKey = new ethers.SigningKey(PRIVATE_KEY);
      const signature = signingKey.sign(safeTxHash);
      
      console.log(`✅ Signature created: ${signature.serialized.toString()}\n`);
      
      // Step 3: Add the signature to the Safe transaction
      console.log('📝 Adding signature to Safe transaction...');
      const safeSignatureObj = {
        signer: signer.address,
        data: signature.serialized.toString(),
        isContractSignature: false,
      };
      
      // Add the signature to the transaction using the SDK's method
      safeTx.addSignature(safeSignatureObj as any);
      console.log(`✅ Safe transaction signed with ethers signature\n`);
      
      // Step 4: Get the encoded transaction for execution
      const encodedTx = await deployedSafeSdk.getEncodedTransaction(safeTx);
      
      finalTx = {
        to: deployedSafeAddress,
        value: '0',
        data: encodedTx,
      };
      
      console.log(`✅ Transaction prepared for deployed Safe:`);
      console.log(`   To: ${finalTx.to}`);
      console.log(`   Value: ${finalTx.value}`);
      console.log(`   Data length: ${finalTx.data.length} bytes\n`);
    } else {
      console.log('🔍 Safe is not deployed');

      // Example: Create a transaction and get the hash to sign
      console.log('📝 Creating a transaction...');
      const safeTx = await safeSdk.createTransaction({
        transactions
      });
        
      // Step 1: Get the Safe transaction hash to sign
      console.log('📋 Getting Safe transaction hash to sign...');
      const safeTxHash = await safeSdk.getTransactionHash(safeTx);
      console.log(`   Safe Tx Hash: ${safeTxHash}\n`);
      
      // Step 2: Sign the Safe transaction hash with ethers
      console.log('✍️ Signing Safe transaction hash with ethers...');
      const signingKey = new ethers.SigningKey(PRIVATE_KEY);
      const signature = signingKey.sign(safeTxHash);
       
      console.log(`✅ Signature created: ${signature.serialized.toString()}\n`);
      
      // Step 3: Add the signature to the Safe transaction
      console.log('📝 Adding signature to Safe transaction...');
      const safeSignatureObj = {
        signer: signer.address,
        data: signature.serialized.toString(),
        isContractSignature: false,
      };
      
      // Add the signature to the transaction using the SDK's method
      safeTx.addSignature(safeSignatureObj as any);
      console.log(`✅ Safe transaction signed with ethers signature\n`);
      
      // Step 4: Wrap the Safe transaction into a deployment batch
      // This creates a transaction that deploys the Safe and executes the transaction in one batch
      console.log('📦 Wrapping Safe transaction into deployment batch...');
      finalTx = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTx);
      
      console.log(`✅ Deployment batch transaction created:`);
      console.log(`   To: ${finalTx.to}`);
      console.log(`   Value: ${finalTx.value || '0'}`);
      console.log(`   Data length: ${finalTx.data.length} bytes\n`);
    }
    
    // Step 5: Sign and broadcast the transaction using ethers with SENDER_KEY
    console.log('✍️ Signing raw blockchain transaction with SENDER_KEY...');
    console.log(`   Sender address: ${senderWallet.address}\n`);
    
    // Get the current nonce for the sender wallet
    const nonce = await senderWallet.getNonce();
    console.log(`   Nonce: ${nonce}`);
    
    // Get gas price/fee
    const feeData = await senderWallet.provider!.getFeeData();
    console.log(`   Gas price: ${feeData.gasPrice?.toString() || 'unknown'}`);
    
    // Estimate gas for the transaction
    // Note: For deployment batch transactions, gas estimation often fails
    // because the transaction involves deploying a Safe which can't be easily estimated
    console.log('⛽ Estimating gas...');
    let gasLimit;

    let txPayload = {
      chainId: CHAIN_ID,
      from: senderWallet.address,
      to: finalTx.to,
      value: finalTx.value,
      data: finalTx.data,
      nonce: nonce,
    };
    
    try {
      const estimatedGas = await senderWallet.provider!.estimateGas(txPayload);
      // Add 20% buffer for safety
      gasLimit = (estimatedGas * 120n) / 100n;
      console.log(`   ✅ Estimated gas: ${estimatedGas.toString()}`);
      console.log(`   Gas limit (with buffer): ${gasLimit.toString()}\n`);
    } catch (error: any) {
      console.log(`   ⚠️ Gas estimation failed, Usually, tx will fail if gas estimation fails so we abort`);
      throw new Error(error.message || error);
    }
    
    // Build the transaction
    const txRequest: ethers.TransactionRequest = {
      ...txPayload,
      gasLimit: gasLimit,
    };
    
    // Add fee data based on network support
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      // EIP-1559 network
      txRequest.maxFeePerGas = feeData.maxFeePerGas;
      txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      // Legacy network
      txRequest.gasPrice = feeData.gasPrice;
    }
    
    console.log('📝 Transaction details:');
    console.log(`   To: ${txRequest.to}`);
    console.log(`   Value: ${txRequest.value}`);
    console.log(`   Gas limit: ${txRequest.gasLimit?.toString()}`);
    console.log(`   Data length: ${txRequest.data?.toString().length || 0} bytes\n`);
    
    // Validate transaction before signing
    console.log('🔍 Validating transaction...');
    if (!finalTx.to || !finalTx.data) {
      throw new Error('Invalid transaction: missing to or data field');
    }
    console.log(`✅ Transaction validated\n`);
    
    // Sign the transaction with SENDER_KEY
    console.log('✍️ Signing transaction with SENDER_KEY...');
    const signedTx = await senderWallet.signTransaction(txRequest);
    console.log(`✅ Transaction signed with SENDER_KEY`);
    console.log(`   Signed TX length: ${signedTx.length} bytes`);
    console.log(`   Signed TX preview: ${signedTx.slice(0, 66)}...\n`);
    
    // Broadcast the transaction using ethers
    console.log('📡 Broadcasting transaction to blockchain...');
    const provider = senderWallet.provider!;
    
    try {
      // Try using sendRawTransaction directly on the provider
      const txResponse = await provider.broadcastTransaction(signedTx);
      
      console.log(`✅ Transaction broadcasted!`);
      console.log(`   Transaction hash: ${txResponse.hash}\n`);
      
      // Wait for the transaction to be mined
      console.log('⏳ Waiting for transaction to be mined...');
      const receipt = await txResponse.wait();
      console.log(`✅ Transaction confirmed!`);
      console.log(`   Block number: ${receipt!.blockNumber}`);
      console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
      console.log(`   Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}\n`);
    } catch (broadcastError: any) {
      console.error(`❌ Broadcast error occurred`);
      console.error(`   Message: ${broadcastError.message}`);
      console.error(`   Code: ${broadcastError.code || 'N/A'}`);
      console.error(`   Error: ${broadcastError.shortMessage || broadcastError.message || 'Unknown error'}`);
      
      // Try to get more details from the error
      if (broadcastError.error) {
        console.error(`   Error details:`, JSON.stringify(broadcastError.error, null, 2));
      }
      if (broadcastError.data) {
        console.error(`   Error data: ${broadcastError.data}`);
      }
      
      // Alternative: try using sendTransaction instead
      console.log('\n🔄 Trying alternative method: sendTransaction...');
      try {
        const txResponse = await senderWallet.sendTransaction(txRequest);
        console.log(`✅ Transaction sent using sendTransaction with SENDER_KEY!`);
        console.log(`   Transaction hash: ${txResponse.hash}\n`);
        
        const receipt = await txResponse.wait();
        console.log(`✅ Transaction confirmed!`);
        console.log(`   Block number: ${receipt!.blockNumber}`);
        console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
        console.log(`   Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}\n`);
      } catch (altError: any) {
        console.error(`❌ Alternative method also failed: ${altError.message}`);
        throw broadcastError; // Throw the original error
      }
    }
    
    // After deployment, the Safe will be at the predicted address
    const deployedSafeAddress = await safeSdk.getAddress();
    console.log(`📍 Safe address: ${deployedSafeAddress}\n`);

    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function transferFromSafe2() {
  console.log('🚀 Safe Protocol Kit Playground - Transfer with Module Enable');
  console.log('==============================================================\n');

  // Example configuration - update these with your values
  const RPC_URL = process.env.RPC_URL!
  const CHAIN_ID = process.env.CHAIN_ID!
  const PRIVATE_KEY = process.env.PRIVATE_KEY!
  const SENDER_KEY = process.env.SENDER_KEY!

  try {    
    // Initialize Safe Protocol Kit
    console.log('📦 Initializing Safe Protocol Kit...');

    const signer = new ethers.Wallet(PRIVATE_KEY!, new ethers.JsonRpcProvider(RPC_URL!));
    // Create sender wallet for signing raw blockchain transactions
    const senderWallet = new ethers.Wallet(SENDER_KEY!, new ethers.JsonRpcProvider(RPC_URL!));
    
    const safeSdk = await Safe.init({
      provider: RPC_URL,
      predictedSafe: {
        // Required: Safe account configuration
        safeAccountConfig: {
          owners: [signer.address], // Required: Array of owner addresses
          threshold: 1,        // Required: Number of signatures needed
        },
        // Optional: Deployment configuration
        safeDeploymentConfig: {
          saltNonce: salt,         // Optional: Salt nonce for deterministic address
          safeVersion: safeVersion,        // Optional: Safe version (e.g., '1.4.1')
          deploymentType: deploymentType,  // Optional: 'canonical' | 'eip155' | 'zksync'
        },
      },
    });

    console.log('✅ Safe SDK initialized');
    console.log(`📍 Safe Address: ${await safeSdk.getAddress()}`);
    console.log(`👥 Owners: ${(await safeSdk.getOwners()).join(', ')}`);
    console.log(`🔢 Threshold: ${await safeSdk.getThreshold()}`);
    console.log(`🔧 Module to enable: ${ERC4337_MODULE_ADDRESS}\n`);

    const isSafeDeployed = await safeSdk.isSafeDeployed();
    let finalSafeSdk = safeSdk;
    
    if(isSafeDeployed) {
      console.log('✅ Safe is already deployed');
      console.log('   ⚠️  Module enablement skipped (Safe is already deployed)');
      console.log('   Proceeding with transfer only...\n');
      
      // Re-initialize SDK with safeAddress instead of predictedSafe for deployed Safe
      const deployedSafeAddress = await safeSdk.getAddress();
      console.log(`📍 Re-initializing SDK with deployed Safe address: ${deployedSafeAddress}\n`);
      
      finalSafeSdk = await Safe.init({
        provider: RPC_URL,
        safeAddress: deployedSafeAddress,
      });
    } else {
      console.log('🔍 Safe is not deployed');
      console.log('   Safe will be deployed and module will be enabled in the same batch\n');
    }

    // Prepare transactions based on deployment status
    console.log('📝 Preparing transactions...');
    
    let transactions;
    
    if (isSafeDeployed) {
      // If Safe is deployed: only transfer (skip module enablement)
      transactions = [
        {
          to: "0x26aCB57e5ee79342e959b50475455Df2C2018A37",
          value: '1', // Amount in wei
          data: '0x', // Transaction data
        },
      ];
      console.log(`   Transaction: Transfer 1 wei to 0x26aCB57e5ee79342e959b50475455Df2C2018A37\n`);
    } else {
      // If Safe is not deployed: enable module first, then transfer
      const safeContract = new ethers.Contract(
        await finalSafeSdk.getAddress(),
        [
          "function enableModule(address module) external"
        ],
        new ethers.JsonRpcProvider(RPC_URL)
      );
      
      const enableModuleData = safeContract.interface.encodeFunctionData(
        "enableModule",
        [ERC4337_MODULE_ADDRESS]
      );

      transactions = [
        {
          to: await finalSafeSdk.getAddress(),
          value: '0',
          data: enableModuleData,
        },
        {
          to: "0x26aCB57e5ee79342e959b50475455Df2C2018A37",
          value: '1', // Amount in wei
          data: '0x', // Transaction data
        },
      ];
      console.log(`   Transaction 1: Enable module ${ERC4337_MODULE_ADDRESS}`);
      console.log(`   Transaction 2: Transfer 1 wei to 0x26aCB57e5ee79342e959b50475455Df2C2018A37\n`);
    }
    
    let finalTx;

    if(isSafeDeployed) {
      // Recreate the transaction with the deployed Safe SDK
      const safeTx = await finalSafeSdk.createTransaction({
        transactions
      });
      
      // Step 1: Get the Safe transaction hash to sign
      console.log('📋 Getting Safe transaction hash to sign...');
      const safeTxHash = await finalSafeSdk.getTransactionHash(safeTx);
      console.log(`   Safe Tx Hash: ${safeTxHash}\n`);
      
      // Step 2: Sign the Safe transaction hash with ethers
      console.log('✍️ Signing Safe transaction hash with ethers...');
      const signingKey = new ethers.SigningKey(PRIVATE_KEY);
      const signature = signingKey.sign(safeTxHash);
      
      console.log(`✅ Signature created: ${signature.serialized.toString()}\n`);
      
      // Step 3: Add the signature to the Safe transaction
      console.log('📝 Adding signature to Safe transaction...');
      const safeSignatureObj = {
        signer: signer.address,
        data: signature.serialized.toString(),
        isContractSignature: false,
      };
      
      // Add the signature to the transaction using the SDK's method
      safeTx.addSignature(safeSignatureObj as any);
      console.log(`✅ Safe transaction signed with ethers signature\n`);
      
      // Step 4: Get the encoded transaction for execution
      const encodedTx = await finalSafeSdk.getEncodedTransaction(safeTx);
      
      finalTx = {
        to: await finalSafeSdk.getAddress(),
        value: '0',
        data: encodedTx,
      };
      
      console.log(`✅ Transaction prepared for deployed Safe:`);
      console.log(`   To: ${finalTx.to}`);
      console.log(`   Value: ${finalTx.value}`);
      console.log(`   Data length: ${finalTx.data.length} bytes\n`);
    } else {
      // Example: Create a transaction and get the hash to sign
      console.log('📝 Creating a transaction...');
      const safeTx = await safeSdk.createTransaction({
        transactions
      });
        
      // Step 1: Get the Safe transaction hash to sign
      console.log('📋 Getting Safe transaction hash to sign...');
      const safeTxHash = await safeSdk.getTransactionHash(safeTx);
      console.log(`   Safe Tx Hash: ${safeTxHash}\n`);
      
      // Step 2: Sign the Safe transaction hash with ethers
      console.log('✍️ Signing Safe transaction hash with ethers...');
      const signingKey = new ethers.SigningKey(PRIVATE_KEY);
      const signature = signingKey.sign(safeTxHash);
       
      console.log(`✅ Signature created: ${signature.serialized.toString()}\n`);
      
      // Step 3: Add the signature to the Safe transaction
      console.log('📝 Adding signature to Safe transaction...');
      const safeSignatureObj = {
        signer: signer.address,
        data: signature.serialized.toString(),
        isContractSignature: false,
      };
      
      // Add the signature to the transaction using the SDK's method
      safeTx.addSignature(safeSignatureObj as any);
      console.log(`✅ Safe transaction signed with ethers signature\n`);
      
      // Step 4: Wrap the Safe transaction into a deployment batch
      // This creates a transaction that deploys the Safe and executes the transaction in one batch
      console.log('📦 Wrapping Safe transaction into deployment batch...');
      finalTx = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTx);
      
      console.log(`✅ Deployment batch transaction created:`);
      console.log(`   To: ${finalTx.to}`);
      console.log(`   Value: ${finalTx.value || '0'}`);
      console.log(`   Data length: ${finalTx.data.length} bytes\n`);
    }
    
    // Step 5: Sign and broadcast the transaction using ethers with SENDER_KEY
    console.log('✍️ Signing raw blockchain transaction with SENDER_KEY...');
    console.log(`   Sender address: ${senderWallet.address}\n`);
    
    // Get the current nonce for the sender wallet
    const nonce = await senderWallet.getNonce();
    console.log(`   Nonce: ${nonce}`);
    
    // Get gas price/fee
    const feeData = await senderWallet.provider!.getFeeData();
    console.log(`   Gas price: ${feeData.gasPrice?.toString() || 'unknown'}`);
    
    // Estimate gas for the transaction
    console.log('⛽ Estimating gas...');
    let gasLimit;

    let txPayload = {
      chainId: CHAIN_ID,
      from: senderWallet.address,
      to: finalTx.to,
      value: finalTx.value,
      data: finalTx.data,
      nonce: nonce,
    };
    
    try {
      const estimatedGas = await senderWallet.provider!.estimateGas(txPayload);
      // Add 20% buffer for safety
      gasLimit = (estimatedGas * 120n) / 100n;
      console.log(`   ✅ Estimated gas: ${estimatedGas.toString()}`);
      console.log(`   Gas limit (with buffer): ${gasLimit.toString()}\n`);
    } catch (error: any) {
      console.log(`   ⚠️ Gas estimation failed, Usually, tx will fail if gas estimation fails so we abort`);
      throw new Error(error.message || error);
    }
    
    // Build the transaction
    const txRequest: ethers.TransactionRequest = {
      ...txPayload,
      gasLimit: gasLimit,
    };
    
    // Add fee data based on network support
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      // EIP-1559 network
      txRequest.maxFeePerGas = feeData.maxFeePerGas;
      txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      // Legacy network
      txRequest.gasPrice = feeData.gasPrice;
    }
    
    console.log('📝 Transaction details:');
    console.log(`   To: ${txRequest.to}`);
    console.log(`   Value: ${txRequest.value}`);
    console.log(`   Gas limit: ${txRequest.gasLimit?.toString()}`);
    console.log(`   Data length: ${txRequest.data?.toString().length || 0} bytes\n`);
    
    // Validate transaction before signing
    console.log('🔍 Validating transaction...');
    if (!finalTx.to || !finalTx.data) {
      throw new Error('Invalid transaction: missing to or data field');
    }
    console.log(`✅ Transaction validated\n`);
    
    // Sign the transaction with SENDER_KEY
    console.log('✍️ Signing transaction with SENDER_KEY...');
    const signedTx = await senderWallet.signTransaction(txRequest);
    console.log(`✅ Transaction signed with SENDER_KEY`);
    console.log(`   Signed TX length: ${signedTx.length} bytes`);
    console.log(`   Signed TX preview: ${signedTx.slice(0, 66)}...\n`);
    
    // Broadcast the transaction using ethers
    console.log('📡 Broadcasting transaction to blockchain...');
    const provider = senderWallet.provider!;
    
    try {
      // Try using sendRawTransaction directly on the provider
      const txResponse = await provider.broadcastTransaction(signedTx);
      
      console.log(`✅ Transaction broadcasted!`);
      console.log(`   Transaction hash: ${txResponse.hash}\n`);
      
      // Wait for the transaction to be mined
      console.log('⏳ Waiting for transaction to be mined...');
      const receipt = await txResponse.wait();
      console.log(`✅ Transaction confirmed!`);
      console.log(`   Block number: ${receipt!.blockNumber}`);
      console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
      console.log(`   Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}\n`);
      
      // Verify module is enabled only if Safe was not deployed (module was enabled in this transaction)
      if (!isSafeDeployed) {
        console.log('🔍 Verifying module is enabled...');
        try {
          // Re-initialize SDK with deployed Safe address to check modules
          const deployedSafeAddress = await safeSdk.getAddress();
          const deployedSafeSdk = await Safe.init({
            provider: RPC_URL,
            safeAddress: deployedSafeAddress,
          });
          
          const modules = await deployedSafeSdk.getModules();
          const isModuleEnabled = modules.includes(ERC4337_MODULE_ADDRESS);
          
          if (isModuleEnabled) {
            console.log(`   ✅ Module successfully enabled at ${ERC4337_MODULE_ADDRESS}\n`);
          } else {
            console.log(`   ⚠️  Module not found in enabled modules list`);
            console.log(`   This might be a timing issue. Please check manually.`);
          }
        } catch (error: any) {
          console.log(`   ⚠️  Could not verify module status: ${error.message}`);
        }
      }
    } catch (broadcastError: any) {
      console.error(`❌ Broadcast error occurred`);
      console.error(`   Message: ${broadcastError.message}`);
      console.error(`   Code: ${broadcastError.code || 'N/A'}`);
      console.error(`   Error: ${broadcastError.shortMessage || broadcastError.message || 'Unknown error'}`);
      
      // Try to get more details from the error
      if (broadcastError.error) {
        console.error(`   Error details:`, JSON.stringify(broadcastError.error, null, 2));
      }
      if (broadcastError.data) {
        console.error(`   Error data: ${broadcastError.data}`);
      }
      
      // Alternative: try using sendTransaction instead
      console.log('\n🔄 Trying alternative method: sendTransaction...');
      try {
        const txResponse = await senderWallet.sendTransaction(txRequest);
        console.log(`✅ Transaction sent using sendTransaction with SENDER_KEY!`);
        console.log(`   Transaction hash: ${txResponse.hash}\n`);
        
        const receipt = await txResponse.wait();
        console.log(`✅ Transaction confirmed!`);
        console.log(`   Block number: ${receipt!.blockNumber}`);
        console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
        console.log(`   Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}\n`);
      } catch (altError: any) {
        console.error(`❌ Alternative method also failed: ${altError.message}`);
        throw broadcastError; // Throw the original error
      }
    }
    
    // After deployment, the Safe will be at the predicted address
    const deployedSafeAddress = await safeSdk.getAddress();
    console.log(`📍 Safe address: ${deployedSafeAddress}\n`);

    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

//DONT NEED TO USE THIS METHOD. TRANSFER ALSO DEPLOYS THE SAFE.
async function deploySafe() {
  console.log('🚀 Safe Deployment Only (main2)');
  console.log('================================\n');

  // Example configuration - update these with your values
  const RPC_URL = process.env.RPC_URL!
  const CHAIN_ID = process.env.CHAIN_ID!
  const PRIVATE_KEY = process.env.PRIVATE_KEY!

  try {
    // Initialize Safe Protocol Kit
    console.log('📦 Initializing Safe Protocol Kit...');

    const signer = new ethers.Wallet(PRIVATE_KEY!, new ethers.JsonRpcProvider(RPC_URL!));
    
    const safeSdk = await Safe.init({
      provider: RPC_URL,
      predictedSafe: {
        // Required: Safe account configuration
        safeAccountConfig: {
          owners: [signer.address], // Required: Array of owner addresses
          threshold: 1,        // Required: Number of signatures needed
        },
        // Optional: Deployment configuration
        safeDeploymentConfig: {
          saltNonce: salt,         // Optional: Salt nonce for deterministic address
          safeVersion: safeVersion,        // Optional: Safe version (e.g., '1.4.1')
          deploymentType: deploymentType,  // Optional: 'canonical' | 'eip155' | 'zksync'
        },
      },
    });

    console.log('✅ Safe SDK initialized');
    console.log(`📍 Predicted Safe Address: ${await safeSdk.getAddress()}`);
    console.log(`👥 Owners: ${(await safeSdk.getOwners()).join(', ')}`);
    console.log(`🔢 Threshold: ${await safeSdk.getThreshold()}\n`);

    // Check if Safe is already deployed
    const isSafeDeployed = await safeSdk.isSafeDeployed();
    
    if (isSafeDeployed) {
      console.log('✅ Safe is already deployed at:', await safeSdk.getAddress());
      console.log('   No need to deploy again.\n');
      return;
    }

    console.log('🔍 Safe is not deployed');
    console.log('📦 Creating Safe deployment transaction...');
    
    // Get the deployment transaction (only deployment, no transaction execution)
    const deploymentTx = await safeSdk.createSafeDeploymentTransaction();
    
    console.log(`✅ Deployment transaction created:`);
    console.log(`   To: ${deploymentTx.to}`);
    console.log(`   Value: ${deploymentTx.value || '0'}`);
    console.log(`   Data length: ${deploymentTx.data.length} bytes\n`);
    
    // Step 2: Sign and broadcast the deployment transaction using ethers
    console.log('✍️ Signing deployment transaction with ethers...');
    
    // Get the current nonce
    const nonce = await signer.getNonce();
    console.log(`   Nonce: ${nonce}`);
    
    // Get gas price/fee
    const feeData = await signer.provider!.getFeeData();
    console.log(`   Gas price: ${feeData.gasPrice?.toString() || 'unknown'}`);
    
    // Estimate gas for the deployment transaction
    console.log('⛽ Estimating gas...');
    let gasLimit;

    let txPayload = {
      chainId: CHAIN_ID,
      from: signer.address,
      to: deploymentTx.to,
      value: deploymentTx.value || '0',
      data: deploymentTx.data,
      nonce: nonce,
    };
    
    try {
      const estimatedGas = await signer.provider!.estimateGas(txPayload);
      // Add 20% buffer for safety
      gasLimit = (estimatedGas * 120n) / 100n;
      console.log(`   ✅ Estimated gas: ${estimatedGas.toString()}`);
      console.log(`   Gas limit (with buffer): ${gasLimit.toString()}\n`);
    } catch (error: any) {
      console.log(`   ⚠️ Gas estimation failed (common for deployment transactions)`);
      console.log(`   Error: ${error.message || error}`);
      // Use a higher default for deployment transactions
      gasLimit = 30000n; // Default for Safe deployment
      console.log(`   Using default gas limit: ${gasLimit.toString()}\n`);
    }
    
    // Build the transaction
    const txRequest: ethers.TransactionRequest = {
      ...txPayload,
      gasLimit: gasLimit,
    };
    
    // Add fee data based on network support
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      // EIP-1559 network
      txRequest.maxFeePerGas = feeData.maxFeePerGas;
      txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      // Legacy network
      txRequest.gasPrice = feeData.gasPrice;
    }
    
    console.log('📝 Transaction details:');
    console.log(`   To: ${txRequest.to}`);
    console.log(`   Value: ${txRequest.value}`);
    console.log(`   Gas limit: ${txRequest.gasLimit?.toString()}`);
    console.log(`   Data length: ${txRequest.data?.toString().length || 0} bytes\n`);
    
    // Validate transaction before signing
    console.log('🔍 Validating transaction...');
    if (!deploymentTx.to || !deploymentTx.data) {
      throw new Error('Invalid transaction: missing to or data field');
    }
    console.log(`✅ Transaction validated\n`);
    
    // Sign the transaction
    console.log('✍️ Signing transaction...');
    const signedTx = await signer.signTransaction(txRequest);
    console.log(`✅ Transaction signed`);
    console.log(`   Signed TX length: ${signedTx.length} bytes`);
    console.log(`   Signed TX preview: ${signedTx.slice(0, 66)}...\n`);
    
    // Broadcast the transaction using ethers
    console.log('📡 Broadcasting deployment transaction to blockchain...');
    const provider = signer.provider!;
    
    try {
      const txResponse = await provider.broadcastTransaction(signedTx);
      
      console.log(`✅ Transaction broadcasted!`);
      console.log(`   Transaction hash: ${txResponse.hash}\n`);
      
      // Wait for the transaction to be mined
      console.log('⏳ Waiting for transaction to be mined...');
      const receipt = await txResponse.wait();
      console.log(`✅ Safe deployed successfully!`);
      console.log(`   Transaction hash: ${txResponse.hash}`);
      console.log(`   Block number: ${receipt!.blockNumber}`);
      console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
      console.log(`   Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}\n`);
      
      // Verify the Safe is now deployed
      const deployedSafeAddress = await safeSdk.getAddress();
      const isNowDeployed = await safeSdk.isSafeDeployed();
      console.log(`📍 Safe address: ${deployedSafeAddress}`);
      console.log(`   Is deployed: ${isNowDeployed ? '✅ Yes' : '❌ No'}\n`);
    } catch (broadcastError: any) {
      console.error(`❌ Broadcast error occurred`);
      console.error(`   Message: ${broadcastError.message}`);
      console.error(`   Code: ${broadcastError.code || 'N/A'}`);
      console.error(`   Error: ${broadcastError.shortMessage || broadcastError.message || 'Unknown error'}`);
      
      // Try to get more details from the error
      if (broadcastError.error) {
        console.error(`   Error details:`, JSON.stringify(broadcastError.error, null, 2));
      }
      if (broadcastError.data) {
        console.error(`   Error data: ${broadcastError.data}`);
      }
      
      // Alternative: try using sendTransaction instead
      console.log('\n🔄 Trying alternative method: sendTransaction...');
      try {
        const txResponse = await signer.sendTransaction(txRequest);
        console.log(`✅ Transaction sent using sendTransaction!`);
        console.log(`   Transaction hash: ${txResponse.hash}\n`);
        
        const receipt = await txResponse.wait();
        console.log(`✅ Safe deployed successfully!`);
        console.log(`   Block number: ${receipt!.blockNumber}`);
        console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
        console.log(`   Status: ${receipt!.status === 1 ? 'Success' : 'Failed'}\n`);
      } catch (altError: any) {
        console.error(`❌ Alternative method also failed: ${altError.message}`);
        throw broadcastError; // Throw the original error
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}


//predictSafe()
//transferFromSafe()
transferFromSafe2()
  .then(() => {
    console.log('\n✨ Playground completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

