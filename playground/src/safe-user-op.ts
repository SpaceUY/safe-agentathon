import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
// @ts-ignore - ESM interop with CommonJS
import SafeModule from '@safe-global/protocol-kit';

// Handle ESM/CommonJS interop - Safe is exported as default from CommonJS
const Safe = (SafeModule as any)?.default || SafeModule;

// Configuration
const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = process.env.CHAIN_ID!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!; // Safe owner's private key
const SENDER_KEY = process.env.SENDER_KEY!; // Private key for funding if needed

// Safe deployment configuration
const salt = process.env.SAFE_SALT || "0x1234";
const safeVersion = process.env.SAFE_VERSION || "1.4.1";
const deploymentType = "canonical";

// Transfer configuration
const transferTo = process.env.TRANSFER_TO || "0x26aCB57e5ee79342e959b50475455Df2C2018A37";
const transferAmount = process.env.TRANSFER_AMOUNT ? BigInt(process.env.TRANSFER_AMOUNT) : 1n;

// ERC-4337 EntryPoint addresses by chain
const ENTRYPOINT_ADDRESSES: Record<string, string> = {
    '80002': '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Polygon Amoy
    '11155111': '0x0576a174D229E3cFA37253523E645A78A0C91B57', // Sepolia
};

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

(async () => {
    try {
        console.log('🚀 Safe Wallet User Operation - Manual Construction');
        console.log('====================================================\n');
        
        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log('📋 Configuration:');
        console.log(`   Owner Address: ${wallet.address}`);
        console.log(`   Chain ID: ${CHAIN_ID}`);
        console.log(`   Salt: ${salt}`);
        console.log(`   Safe Version: ${safeVersion}`);
        console.log(`   Transfer To: ${transferTo}`);
        console.log(`   Transfer Amount: ${transferAmount} wei\n`);
        
        // Initialize Safe SDK with predicted Safe wallet
        console.log('📦 Initializing Safe SDK with predicted Safe...');
        const safeSdk = await Safe.init({
            provider: RPC_URL,
            predictedSafe: {
                safeAccountConfig: {
                    owners: [wallet.address],
                    threshold: 1,
                },
                safeDeploymentConfig: {
                    saltNonce: salt,
                    safeVersion: safeVersion,
                    deploymentType: deploymentType,
                },
            },
        });
        
        const predictedSafeAddress = await safeSdk.getAddress();
        console.log(`✅ Safe SDK initialized`);
        console.log(`📍 Predicted Safe Address: ${predictedSafeAddress}\n`);
        
        // Check if Safe is deployed
        let isDeployed;
        let finalSafeSdk = safeSdk;

        isDeployed = await safeSdk.isSafeDeployed();
        console.log(`   Safe Deployed: ${isDeployed ? '✅ Yes' : '❌ No'}`);
        
        if (isDeployed) {
            const actualVersion = await safeSdk.getContractVersion();
            console.log(`   Safe Version: ${actualVersion}`);
            
            // Re-initialize SDK with deployed Safe address
            console.log('   Re-initializing SDK with deployed Safe address...');
            const deployedSafeAddress = await safeSdk.getAddress();
            finalSafeSdk = await Safe.init({
                provider: RPC_URL,
                safeAddress: deployedSafeAddress,
            });
            console.log(`   ✅ SDK re-initialized with deployed Safe: ${deployedSafeAddress}\n`);
        } else {
            console.log(`   Safe will be deployed with user operation\n`);
        }
  
        
        // Create Safe transaction
        console.log('📝 Creating Safe transaction...');
        const safeTx = await finalSafeSdk.createTransaction({
            transactions: [{
                to: transferTo,
                value: transferAmount.toString(),
                data: '0x',
            }]
        });
        
        console.log('✅ Safe transaction created');
        
        // Get Safe transaction hash and sign
        console.log('🔐 Signing Safe transaction...');
        const safeTxHash = await finalSafeSdk.getTransactionHash(safeTx);
        
        const signingKey = new ethers.SigningKey(PRIVATE_KEY);
        const signature = signingKey.sign(safeTxHash);
        const safeSignatureObj = {
            signer: wallet.address,
            data: signature.serialized.toString(),
            isContractSignature: false,
        };
        
        safeTx.addSignature(safeSignatureObj as any);
        console.log('✅ Safe transaction signed\n');
        
        // Get deployment transaction if needed
        let initCode = "0x";
        let callData: string;
        
        if (!isDeployed) {
            console.log('🏭 Getting Safe deployment transaction...');
            const deploymentTx = await safeSdk.createSafeDeploymentTransaction();
            const factory = deploymentTx.to;
            const factoryData = deploymentTx.data;
            
            // Construct initCode (factory address + factoryData)
            initCode = factory + factoryData.slice(2);
            
            console.log(`   Factory: ${factory}`);
            console.log(`   Factory Data length: ${factoryData.length} bytes`);
            console.log(`   InitCode length: ${initCode.length} bytes`);
            
            // Wrap transaction with deployment
            console.log('📦 Wrapping Safe transaction with deployment...');
            const wrappedTx = await safeSdk.wrapSafeTransactionIntoDeploymentBatch(safeTx);
            callData = wrappedTx.data;
            console.log(`   Wrapped CallData length: ${callData.length} bytes\n`);
        } else {
            console.log('📦 Encoding Safe transaction...');
            callData = await finalSafeSdk.getEncodedTransaction(safeTx);
            console.log(`   CallData length: ${callData.length} bytes\n`);
        }
        
        // Ensure Safe has balance if deployed
        if (isDeployed) {
            console.log('💰 Checking Safe wallet balance...');
            const senderWallet = new ethers.Wallet(SENDER_KEY, provider);
            const balance = await provider.getBalance(predictedSafeAddress);
            const requiredBalance = transferAmount;
            
            if (balance < requiredBalance) {
                const shortfall = requiredBalance - balance;
                console.log(`   Insufficient balance. Funding with ${ethers.formatEther(shortfall)} ETH...`);
                const fundTx = await senderWallet.sendTransaction({
                    to: predictedSafeAddress,
                    value: shortfall
                });
                await fundTx.wait();
                console.log('   ✅ Safe funded\n');
            } else {
                console.log('   ✅ Safe has sufficient balance\n');
            }
        }
        
        // Get EntryPoint address
        const entryPointAddress = ENTRYPOINT_ADDRESSES[CHAIN_ID];
        console.log(`📍 EntryPoint Address: ${entryPointAddress}\n`);
        
        // Construct user operation
        console.log('🔧 Constructing user operation...');
        const userOp = await constructUserOperation(
            predictedSafeAddress,
            predictedSafeAddress,
            callData,
            initCode,
            entryPointAddress,
            provider
        );
        
        console.log('✅ User operation constructed:');
        console.log(JSON.stringify(userOp, null, 2));
        console.log('');
        
        // Sign user operation
        console.log('✍️ Signing user operation...');
        let userOpHash: string;
        try {
            userOpHash = await getUserOpHash(userOp, entryPointAddress, provider);
            const userOpSignature = await wallet.signMessage(ethers.getBytes(userOpHash));
            userOp.signature = userOpSignature;
            console.log('✅ User operation signed');
            console.log(`   UserOp Hash: ${userOpHash}\n`);
        } catch (error: any) {
            console.error('❌ ERROR signing user operation:', error);
            console.error(`   Error message: ${error.message}`);
            throw new Error(`Failed to sign user operation: ${error.message}`);
        }
        
        // Send user operation
        console.log('📡 Sending user operation to bundler...');
        const bundlerUrl = process.env.BUNDLER_RPC_URL;
        const alchemyNetwork = ALCHEMY_NETWORKS[CHAIN_ID];
        
        try {
            const result = await sendUserOperation(userOp, bundlerUrl, alchemyNetwork);
            console.log('✅ User operation sent!');
            console.log(`   UserOp Hash: ${result.userOpHash}`);
            console.log(`   Monitor at: https://amoy.polygonscan.com/\n`);
        } catch (error: any) {
            console.error('❌ ERROR sending user operation:', error);
            console.error(`   Error message: ${error.message}`);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();

async function constructUserOperation(
    sender: string,
    to: string,
    callData: string,
    initCode: string,
    entryPoint: string,
    provider: ethers.Provider
) {
    // Get nonce from EntryPoint
    // Note: Safe wallets are not ERC-4337 accounts, so this may fail
    let nonce = 0n;
    try {
        const entryPointAbi = [
            "function getNonce(address sender, uint192 key) external view returns (uint256 nonce)"
        ];
        const entryPointContract = new ethers.Contract(entryPoint, entryPointAbi, provider);
        nonce = await entryPointContract.getNonce(sender, 0);
        console.log(`   ✅ Got nonce from EntryPoint: ${nonce.toString()}`);
    } catch (error: any) {
        console.log(`   ⚠️  Could not get nonce from EntryPoint (expected for non-ERC-4337 accounts)`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Using nonce 0 (this may cause issues if Safe is not ERC-4337 compatible)`);
        // Use nonce 0 as fallback
        nonce = 0n;
    }
    
    // Get fee data
    const feeData = await provider.getFeeData();
    
    // Build initial user operation (without signature) for gas estimation
    const initialUserOp = {
        sender: sender,
        nonce: `0x${nonce.toString(16)}`,
        initCode: initCode,
        callData: callData,
        callGasLimit: "0x0", // Will be estimated
        verificationGasLimit: "0x0", // Will be estimated
        preVerificationGas: "0x0", // Will be estimated
        maxFeePerGas: feeData.maxFeePerGas ? `0x${feeData.maxFeePerGas.toString(16)}` : "0x0",
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? `0x${feeData.maxPriorityFeePerGas.toString(16)}` : "0x0",
        paymasterAndData: "0x",
        signature: "0x" // Placeholder for estimation
    };
    
    // Estimate gas using bundler
    console.log('   Estimating gas limits...');
    let estimatedGas;
    try {
        estimatedGas = await estimateUserOperationGas(initialUserOp, entryPoint, provider);
        console.log(`   ✅ Gas estimated:`);
        console.log(`      callGasLimit: ${estimatedGas.callGasLimit}`);
        console.log(`      verificationGasLimit: ${estimatedGas.verificationGasLimit}`);
        console.log(`      preVerificationGas: ${estimatedGas.preVerificationGas}`);
    } catch (error: any) {
        console.log(`   ⚠️  Gas estimation failed: ${error.message}`);
        console.log(`   Using fallback gas limits...`);
        
        // Use higher defaults for Safe deployment + execution
        const isDeployment = initCode !== "0x";
        if (isDeployment) {
            // Higher limits for deployment + execution
            estimatedGas = {
                callGasLimit: "0x61A80", // 400000 - Safe deployment + execution needs more
                verificationGasLimit: "0x7A120", // 500000 - Higher for deployment validation
                preVerificationGas: "0x9C40", // 40000
            };
            console.log(`   Using deployment gas limits (higher for Safe deployment)`);
        } else {
            // Standard limits for execution only
            estimatedGas = {
                callGasLimit: "0x186A0", // 100000
                verificationGasLimit: "0x30D40", // 200000
                preVerificationGas: "0xC350", // 50000
            };
            console.log(`   Using standard gas limits`);
        }
    }
    
    return {
        sender: sender,
        nonce: `0x${nonce.toString(16)}`,
        initCode: initCode, // ERC-4337 uses initCode directly
        callData: callData,
        callGasLimit: estimatedGas.callGasLimit,
        verificationGasLimit: estimatedGas.verificationGasLimit,
        preVerificationGas: estimatedGas.preVerificationGas,
        maxFeePerGas: feeData.maxFeePerGas ? `0x${feeData.maxFeePerGas.toString(16)}` : "0x0",
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? `0x${feeData.maxPriorityFeePerGas.toString(16)}` : "0x0",
        paymasterAndData: "0x",
        signature: "0x" // Will be filled after signing
    };
}

async function estimateUserOperationGas(
    userOp: any,
    entryPoint: string,
    provider: ethers.Provider
): Promise<{ callGasLimit: string; verificationGasLimit: string; preVerificationGas: string }> {
    const apiKey = process.env.ALCHEMY_API_KEY;
    const chainId = CHAIN_ID;
    const alchemyNetwork = ALCHEMY_NETWORKS[chainId];
    
    let url: string;
    if (apiKey && alchemyNetwork) {
        url = `https://${alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
    } else if (process.env.BUNDLER_RPC_URL) {
        url = process.env.BUNDLER_RPC_URL;
    } else {
        throw new Error('Cannot estimate gas: No bundler URL available');
    }
    
    const payload = {
        "jsonrpc": "2.0",
        "method": "eth_estimateUserOperationGas",
        "params": [userOp, entryPoint],
        "id": Math.floor(Math.random() * 1000000)
    };
    
    console.log(`   Estimating gas via: ${url}`);
    console.log(`   Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.log(`   Response status: ${response.status} ${response.statusText}`);
        console.log(`   Response body: ${errorText}`);
        throw new Error(`Gas estimation failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result: any = await response.json();
    console.log(`   Gas estimation response:`, JSON.stringify(result, null, 2));
    
    if (result.error) {
        const errorMsg = result.error.message || JSON.stringify(result.error);
        const errorCode = result.error.code || 'N/A';
        const errorReason = result.error.data?.reason || 'N/A';
        
        console.log(`\n   ❌ Gas estimation error: ${errorMsg}`);
        console.log(`   Error code: ${errorCode}`);
        console.log(`   Error reason: ${errorReason}`);
        
        throw new Error(`Gas estimation error: ${errorMsg}`);
    }
    
    if (!result.result) {
        throw new Error('Gas estimation returned no result');
    }
    
    return {
        callGasLimit: result.result.callGasLimit || result.result.callGas || "0x186A0",
        verificationGasLimit: result.result.verificationGasLimit || result.result.verificationGas || "0x30D40",
        preVerificationGas: result.result.preVerificationGas || result.result.preVerificationGasLimit || "0xC350"
    };
}

async function getUserOpHash(
    userOp: any,
    entryPoint: string,
    provider: ethers.Provider
): Promise<string> {
    // Use initCode directly from userOp (ERC-4337 format)
    const initCode = userOp.initCode || "0x";
    
    // Pack user operation hash according to ERC-4337
    const packed = ethers.solidityPacked(
        [
            "address", // sender
            "uint256", // nonce
            "bytes32", // initCode hash
            "bytes32", // callData hash
            "uint256", // callGasLimit
            "uint256", // verificationGasLimit
            "uint256", // preVerificationGas
            "uint256", // maxFeePerGas
            "uint256", // maxPriorityFeePerGas
            "bytes32", // paymasterAndData hash
        ],
        [
            userOp.sender,
            BigInt(userOp.nonce),
            ethers.keccak256(initCode),
            ethers.keccak256(userOp.callData),
            BigInt(userOp.callGasLimit),
            BigInt(userOp.verificationGasLimit),
            BigInt(userOp.preVerificationGas),
            BigInt(userOp.maxFeePerGas),
            BigInt(userOp.maxPriorityFeePerGas),
            ethers.keccak256(userOp.paymasterAndData || "0x"),
        ]
    );
    
    // Hash with EntryPoint address and chain ID
    const chainId = await provider.getNetwork().then(n => n.chainId);
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256"],
        [ethers.keccak256(packed), entryPoint, chainId]
    );
    
    return ethers.keccak256(encoded);
}

async function sendUserOperation(
    userOp: any, 
    bundlerUrl: string | undefined, 
    alchemyNetwork: string | undefined
): Promise<{ userOpHash: string }> {
    const apiKey = process.env.ALCHEMY_API_KEY;
    
    // Determine if using Alchemy API or direct bundler
    let url: string;
    let payload: any;
    
    if (bundlerUrl) {
        // Use provided bundler URL
        url = bundlerUrl;
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_sendUserOperation",
            "params": [userOp, ENTRYPOINT_ADDRESSES[CHAIN_ID]],
            "id": Math.floor(Math.random() * 1000000)
        };
    } else if (apiKey && alchemyNetwork) {
        // Alchemy API format - MUST include network name
        url = `https://${alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_sendUserOperation",
            "params": [userOp, ENTRYPOINT_ADDRESSES[CHAIN_ID]],
            "id": Math.floor(Math.random() * 1000000)
        };
        console.log(`   Using Alchemy bundler for network: ${alchemyNetwork}`);
    } else {
        throw new Error(
            `Cannot determine bundler URL. Either provide BUNDLER_RPC_URL or set ALCHEMY_API_KEY and use a supported network. ` +
            `Chain ID: ${CHAIN_ID}, Alchemy Network: ${alchemyNetwork || 'NOT FOUND'}`
        );
    }
    
    console.log(`   Sending to: ${url}`);
    console.log(`   Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bundler request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result: any = await response.json();
    
    if (result.error) {
        throw new Error(`Bundler error: ${result.error.message || JSON.stringify(result.error)}`);
    }
    
    return {
        userOpHash: result.result
    };
}

