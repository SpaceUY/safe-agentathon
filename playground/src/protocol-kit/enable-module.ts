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
const MODULE_ADDRESS = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226"; // Module address to enable
const SAFE_WALLET_ADDRESS = "0x3Ed65Bc7A9b49AB4B601b2a8e98610079BC17303";

(async () => {
    try {
        console.log('🔧 Enable Safe Module');
        console.log('======================\n');
        
        // Validate module address format
        if (!ethers.isAddress(MODULE_ADDRESS)) {
            throw new Error(`Invalid module address: ${MODULE_ADDRESS}`);
        }
        
        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log('📋 Configuration:');
        console.log(`   Safe Wallet Address: ${SAFE_WALLET_ADDRESS}`);
        console.log(`   Module Address: ${MODULE_ADDRESS}`);
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
        
        // Check if module is already enabled
        console.log('🔍 Checking module status...');
        try {
            const modules = await safeSdk.getModules();
            const isModuleEnabled = modules.includes(MODULE_ADDRESS);
            
            if (isModuleEnabled) {
                console.log(`   ✅ Module is already enabled at ${MODULE_ADDRESS}`);
                console.log(`\n   Current modules:`);
                modules.forEach((module: string, index: number) => {
                    console.log(`      ${index + 1}. ${module}`);
                });
                console.log('\n   No action needed. Exiting...\n');
                process.exit(0);
            } else {
                console.log(`   ❌ Module is not enabled`);
                console.log(`\n   Current modules: ${modules.length > 0 ? modules.join(', ') : 'None'}\n`);
            }
        } catch (error: any) {
            console.log(`   ⚠️  Could not check module status: ${error.message}`);
            console.log(`   Proceeding with enable transaction...\n`);
        }
        
        // Create transaction to enable module
        console.log('📝 Creating transaction to enable module...');
        
        // The Safe contract has an enableModule function
        // We need to create a transaction that calls enableModule(moduleAddress)
        const safeContract = new ethers.Contract(
            SAFE_WALLET_ADDRESS,
            [
                "function enableModule(address module) external"
            ],
            provider
        );
        
        // Encode the enableModule call
        const enableModuleData = safeContract.interface.encodeFunctionData(
            "enableModule",
            [MODULE_ADDRESS]
        );
        
        // Create Safe transaction
        const safeTx = await safeSdk.createTransaction({
            transactions: [{
                to: SAFE_WALLET_ADDRESS,
                value: '0',
                data: enableModuleData,
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
        
        // Verify module is now enabled
        console.log('🔍 Verifying module is enabled...');
        try {
            const modules = await safeSdk.getModules();
            const isModuleEnabled = modules.includes(MODULE_ADDRESS);
            
            if (isModuleEnabled) {
                console.log(`   ✅ Module successfully enabled at ${MODULE_ADDRESS}\n`);
                console.log(`   All enabled modules:`);
                modules.forEach((module: string, index: number) => {
                    console.log(`      ${index + 1}. ${module}`);
                });
            } else {
                console.log(`   ⚠️  Module not found in enabled modules list`);
                console.log(`   This might be a timing issue. Please check manually.`);
            }
        } catch (error: any) {
            console.log(`   ⚠️  Could not verify module status: ${error.message}`);
        }
        
        console.log('\n✨ Module enablement completed!\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();

