import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
// @ts-ignore - ESM interop with CommonJS
import SafeModule from '@safe-global/protocol-kit';

// Handle ESM/CommonJS interop - Safe is exported as default from CommonJS
const Safe = (SafeModule as any)?.default || SafeModule;

// Configuration
const RPC_URL = process.env.RPC_URL!;
//const SAFE_WALLET_ADDRESS = "0xAC5D465B855D22f1a984f55A7859d197C11aA2E2";
const SAFE_WALLET_ADDRESS = "0x3Ed65Bc7A9b49AB4B601b2a8e98610079BC17303";

(async () => {
    try {
        console.log('🔍 Getting Safe Wallet Version');
        console.log('==============================\n');
        
        // Initialize provider
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        
        console.log('📋 Configuration:');
        console.log(`   Safe Wallet Address: ${SAFE_WALLET_ADDRESS}`);
        console.log(`   RPC URL: ${RPC_URL}\n`);
        
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
        
        // Get Safe version
        console.log('📦 Getting Safe contract version...');
        const version = await safeSdk.getContractVersion();
        
        console.log('\n✅ Safe Version Information:');
        console.log(`   Version: ${version}`);
        try{
            console.log(`   Modules: ${await safeSdk.getModules()}`);
        } catch (error) {
            console.log('   Modules: No modules enabled');
        }
        //console.log(`   Safe Address: ${await safeSdk.getAddress()}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();

