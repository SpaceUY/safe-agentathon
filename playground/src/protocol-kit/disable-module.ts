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
const MODULE_ADDRESS = "0xa581c4A4DB7175302464fF3C06380BC3270b4037"; // Module address to disable
const SAFE_WALLET_ADDRESS = "0x234A8E69f15179e38706CAd12550AfD8dbE3b6a3";
const SENTINEL_ADDRESS = "0x0000000000000000000000000000000000000001";

(async () => {
    try {
        console.log('🧹 Disable Safe Module');
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
        
        // Check if module is currently enabled and capture module list
        console.log('🔍 Checking module status...');
        const modules = await safeSdk.getModules();
        const moduleIndex = modules.findIndex((module: string) => module.toLowerCase() === MODULE_ADDRESS.toLowerCase());
        const isModuleEnabled = moduleIndex >= 0;
        
        if (!isModuleEnabled) {
            console.log(`   ❌ Module is not enabled at ${MODULE_ADDRESS}`);
            console.log(`\n   Current modules: ${modules.length > 0 ? modules.join(', ') : 'None'}\n`);
            console.log('   No action needed. Exiting...\n');
            process.exit(0);
        }
        
        console.log(`   ✅ Module found at index ${moduleIndex}`);
        console.log(`\n   Current modules:`);
        modules.forEach((module: string, index: number) => {
            console.log(`      ${index + 1}. ${module}`);
        });
        console.log();
        
        // Determine the previous module needed for disableModule
        const prevModuleAddress = moduleIndex === 0 ? SENTINEL_ADDRESS : modules[moduleIndex - 1];
        console.log(`   Previous Module Address: ${prevModuleAddress}\n`);
        
        // Create transaction to disable module
        console.log('📝 Creating transaction to disable module...');
        
        // The Safe contract has a disableModule function requiring (prevModule, module)
        const safeContract = new ethers.Contract(
            SAFE_WALLET_ADDRESS,
            [
                "function disableModule(address prevModule, address module) external"
            ],
            provider
        );
        
        // Encode the disableModule call
        const disableModuleData = safeContract.interface.encodeFunctionData(
            "disableModule",
            [prevModuleAddress, MODULE_ADDRESS]
        );
        
        // Create Safe transaction
        const safeTx = await safeSdk.createTransaction({
            transactions: [{
                to: SAFE_WALLET_ADDRESS,
                value: '0',
                data: disableModuleData,
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
        
        // Verify module is now disabled
        console.log('🔍 Verifying module is disabled...');
        const updatedModules = await safeSdk.getModules();
        const stillEnabled = updatedModules.some((module: string) => module.toLowerCase() === MODULE_ADDRESS.toLowerCase());
        
        if (!stillEnabled) {
            console.log(`   ✅ Module successfully disabled at ${MODULE_ADDRESS}\n`);
            console.log(`   Remaining modules: ${updatedModules.length > 0 ? '' : 'None'}`);
            updatedModules.forEach((module: string, index: number) => {
                console.log(`      ${index + 1}. ${module}`);
            });
        } else {
            console.log(`   ⚠️  Module still appears in the enabled list. Please double-check manually.`);
        }
        
        console.log('\n✨ Module disablement completed!\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();


