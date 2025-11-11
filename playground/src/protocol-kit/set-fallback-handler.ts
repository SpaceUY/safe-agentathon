import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
// @ts-ignore - ESM interop with CommonJS
import SafeModule from '@safe-global/protocol-kit';

// Handle ESM/CommonJS interop - Safe is exported as default from CommonJS
const Safe = (SafeModule as any)?.default || SafeModule;

// Configuration
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!; // Safe owner's private key
const SAFE_WALLET_ADDRESS = "0x234A8E69f15179e38706CAd12550AfD8dbE3b6a3";
const FALLBACK_HANDLER_ADDRESS = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226"; // 4337 module/fallback handler

(async () => {
    try {
        console.log('🪝 Set Safe Fallback Handler');
        console.log('============================\n');
        
        // Validate fallback handler address format
        if (!ethers.isAddress(FALLBACK_HANDLER_ADDRESS)) {
            throw new Error(`Invalid fallback handler address: ${FALLBACK_HANDLER_ADDRESS}`);
        }
        
        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log('📋 Configuration:');
        console.log(`   Safe Wallet Address: ${SAFE_WALLET_ADDRESS}`);
        console.log(`   Fallback Handler Address: ${FALLBACK_HANDLER_ADDRESS}`);
        console.log(`   Owner Address: ${wallet.address}`);
        console.log(`   Chain ID: ${await provider.getNetwork().then(n => n.chainId)}\n`);
        
        // Initialize Safe SDK with deployed Safe wallet address
        console.log('📦 Initializing Safe SDK...');
        const safeSdk = await Safe.init({
            provider: RPC_URL,
            safeAddress: SAFE_WALLET_ADDRESS,
        });
        
        console.log('✅ Safe SDK initialized\n');
        
        // Check if Safe is deployed
        const isDeployed = await safeSdk.isSafeDeployed();
        if (!isDeployed) {
            throw new Error('Safe wallet is not deployed at the provided address');
        }
        
        console.log('✅ Safe is deployed\n');
        
        // Check current fallback handler
        console.log('🔍 Checking current fallback handler...');
        const currentFallbackHandler = await safeSdk.getFallbackHandler();
        console.log(`   Current Fallback Handler: ${currentFallbackHandler}`);
        
        if (currentFallbackHandler?.toLowerCase() === FALLBACK_HANDLER_ADDRESS.toLowerCase()) {
            console.log('\n   ✅ Fallback handler already set to desired address.');
            console.log('   No action needed. Exiting...\n');
            process.exit(0);
        }
        
        if (!currentFallbackHandler || currentFallbackHandler === ethers.ZeroAddress) {
            console.log('   ℹ️  No fallback handler currently set.');
        } else {
            console.log('   ℹ️  Fallback handler will be updated to the new address.');
        }
        console.log();
        
        // Create transaction to set fallback handler
        console.log('📝 Creating transaction to set fallback handler...');
        
        const safeContract = new ethers.Contract(
            SAFE_WALLET_ADDRESS,
            [
                "function setFallbackHandler(address handler) external"
            ],
            provider
        );
        
        // Encode the setFallbackHandler call
        const setFallbackHandlerData = safeContract.interface.encodeFunctionData(
            "setFallbackHandler",
            [FALLBACK_HANDLER_ADDRESS]
        );
        
        // Create Safe transaction
        const safeTx = await safeSdk.createTransaction({
            transactions: [{
                to: SAFE_WALLET_ADDRESS,
                value: '0',
                data: setFallbackHandlerData,
            }]
        });
        
        console.log('✅ Transaction created\n');
        
        // Get Safe transaction hash and sign
        console.log('🔐 Signing Safe transaction...');
        const safeTxHash = await safeSdk.getTransactionHash(safeTx);
        console.log(`   Transaction Hash: ${safeTxHash}\n`);
        
        const signingKey = new ethers.SigningKey(PRIVATE_KEY);
        const signature = signingKey.sign(safeTxHash);
        const safeSignatureObj = {
            signer: wallet.address,
            data: signature.serialized.toString(),
            isContractSignature: false,
        };
        
        safeTx.addSignature(safeSignatureObj as any);
        console.log('✅ Safe transaction signed\n');
        
        // Get encoded transaction
        console.log('📦 Encoding transaction...');
        const encodedTx = await safeSdk.getEncodedTransaction(safeTx);
        console.log('✅ Transaction encoded\n');
        
        // Execute transaction
        console.log('🚀 Executing transaction...');
        const txResponse = await wallet.sendTransaction({
            to: SAFE_WALLET_ADDRESS,
            value: 0,
            data: encodedTx,
        });
        
        console.log(`   Transaction Hash: ${txResponse.hash}`);
        console.log(`   Waiting for confirmation...\n`);
        
        const receipt = await txResponse.wait();
        console.log('✅ Transaction confirmed!');
        console.log(`   Block Number: ${receipt?.blockNumber}`);
        console.log(`   Gas Used: ${receipt?.gasUsed.toString()}\n`);
        
        // Verify fallback handler is now set
        console.log('🔍 Verifying fallback handler...');
        const updatedFallbackHandler = await safeSdk.getFallbackHandler();
        console.log(`   Updated Fallback Handler: ${updatedFallbackHandler}`);
        
        if (updatedFallbackHandler?.toLowerCase() === FALLBACK_HANDLER_ADDRESS.toLowerCase()) {
            console.log(`\n   ✅ Fallback handler successfully set to ${FALLBACK_HANDLER_ADDRESS}\n`);
        } else {
            console.log(`\n   ⚠️  Fallback handler was not updated as expected. Please double-check manually.`);
        }
        
        console.log('\n✨ Fallback handler update completed!\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();


