import { Chain, createPublicClient, createWalletClient, http, WalletClient } from 'viem';
import { privateKeyToAccount, Address, Account, generatePrivateKey } from 'viem/accounts';
import { kaia } from 'viem/chains'
import { z } from 'zod';

type NetworkType = 'kaia'

type AgentMode = 'readonly' | 'transaction';

interface NetworkConfig {
    rpcProviderUrl: string;
    blockExplorer: string;
    chain: Chain;
    chainId: number;
    nativeCurrency: string;
}

// KAIA MCP Environment Configuration
export interface KAIAMCPEnvironment {
    kaiaRpcUrl: string;
    privateKey?: string;
    agentMode: AgentMode;
    network: NetworkType;
}

// Validation schemas using zod
export const KAIAMCPEnvironmentSchema = z.object({
    kaiaRpcUrl: z.string().url().describe("KAIA RPC URL"),
    privateKey: z.string().optional().describe("Wallet private key for transaction mode"),
    agentMode: z.enum(['readonly', 'transaction']).default('readonly').describe("Agent mode: readonly or transaction"),
    network: z.enum(['kaia']).default('kaia').describe("Network to use")
});

export type KAIAMCPEnvironmentInput = z.infer<typeof KAIAMCPEnvironmentSchema>;

// Contract addresses for Kaia Mainnet - KiloLend Protocol
const CONTRACT_ADDRESSES = {
    kaia: {
        // KiloLend Protocol Contracts
        comptroller: "0x0B5f0Ba5F13eA4Cb9C8Ee48FB75aa22B451470C2",
        oracle: "0xBB265F42Cce932c5e383536bDf50B82e08eaf454",
        
        // KiloLend cTokens (Lending Markets)
        cUSDT: "0x498823F094f6F2121CcB4e09371a57A96d619695",
        cSIX: "0xC468dFD0C96691035B3b1A4CA152Cb64F0dbF64c",
        cBORA: "0x7a937C07d49595282c711FBC613c881a83B9fDFD",
        cMBX: "0xE321e20F0244500A194543B1EBD8604c02b8fA85",
        cKAIA: "0x98Ab86C97Ebf33D28fc43464353014e8c9927aB3",
        cStKAIA: "0x0BC926EF3856542134B06DCf53c86005b08B9625",
        
        // Underlying Token Addresses
        usdt_official: "0xd077a400968890eacc75cdc901f0356c943e4fdb", // Official USDT (fixed checksum)
        usdt_wormhole: "0x5c13e303a62fc5dedf5b52d66873f2e59fedadc2", // Wormhole USDT (fixed checksum)
        usdt: "0xd077a400968890eacc75cdc901f0356c943e4fdb", // Default to Official USDT (fixed checksum)
        six: "0xEf82b1C6A550e730D8283E1eDD4977cd01FAF435",
        bora: "0x02cbE46fB8A1F579254a9B485788f2D86Cad51aa",
        mbx: "0xD068c52d81f4409B9502dA926aCE3301cc41f623",
        stakedKaia: "0x42952B873ed6f7f0A7E4992E2a9818E3A9001995"
    }
} as const;

export function getEnvironmentConfig(): KAIAMCPEnvironment {
    // Validate required environment variables
    const required = ['KAIA_RPC_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        console.error(`💡 Please set the following in your .env file:`);
        missing.forEach(key => {
            const envKey = key.replace('KAIA_', '').toLowerCase();
            console.error(`   ${key}=your_${envKey}_here`);
        });
        throw new Error('Missing required KAIA MCP configuration');
    }

    const config: KAIAMCPEnvironment = {
        kaiaRpcUrl: process.env.KAIA_RPC_URL!,
        agentMode: (process.env.KAIA_AGENT_MODE as AgentMode) || 'readonly',
        network: (process.env.KAIA_NETWORK as NetworkType) || 'kaia'
    };

    // Only add private key if it exists
    if (process.env.KAIA_PRIVATE_KEY) {
        config.privateKey = process.env.KAIA_PRIVATE_KEY;
    }

    return config;
}

// Validate environment variables and log configuration
export function validateEnvironment(): void {
    try {
        const config = getEnvironmentConfig();
        console.error(`✅ KAIA-MCP environment configuration valid`);
        console.error(`📍 Mode: ${config.agentMode}`);
        console.error(`📍 Network: ${config.network}`);
        console.error(`📍 RPC URL: ${config.kaiaRpcUrl}`);
        console.error(`📍 Chain ID: ${networkInfo.chainId}`);
        console.error(`📍 Native Currency: ${networkInfo.nativeCurrency}`);
        console.error(`📍 Account: ${account.address}`);

        if (config.privateKey) {
            console.error(`📍 Using provided private key for transactions`);
        } else {
            console.error(`📍 No private key provided - read-only mode`);
        }

    } catch (error) {
        console.error('❌ Invalid environment configuration:', error);
        throw error;
    }
}

// Network configurations - Kaia Mainnet only
const networkConfigs: Record<NetworkType, NetworkConfig> = {
    kaia: {
        rpcProviderUrl: 'https://public-en.node.kaia.io',
        blockExplorer: 'https://www.kaiascan.io',
        chain: kaia,
        chainId: 8217,
        nativeCurrency: 'KAIA'
    }
} as const;

const getNetwork = (): NetworkType => {
    const config = getEnvironmentConfig();
    const network = config.network;

    if (network && !(network in networkConfigs)) {
        throw new Error(`Invalid network: ${network}. Only 'kaia' is supported.`);
    }
    return network || 'kaia';
};

const getAccount = (): Account => {
    const config = getEnvironmentConfig();
    const hasPrivateKey = !!(config?.privateKey);

    if (!hasPrivateKey) {
        const privateKey = generatePrivateKey();
        return privateKeyToAccount(privateKey);
    } else {
        const privateKey = config.privateKey!;
        const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        
        // Validate that the private key is a valid hex string
        if (!/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)) {
            throw new Error(`Invalid private key format. Expected 64 hex characters (32 bytes), got: ${formattedPrivateKey.length - 2} characters`);
        }
        
        return privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    }
}

// Initialize client configuration
export const network = getNetwork();

export const networkInfo = {
    ...networkConfigs[network],
    rpcProviderUrl: getEnvironmentConfig().kaiaRpcUrl,
};

// API Configuration
export const apiConfig = {
    baseUrl: process.env.API_BASE_URL || 'https://kvxdikvk5b.execute-api.ap-southeast-1.amazonaws.com/prod',
    priceUrl: process.env.PRICE_URL || 'https://kvxdikvk5b.execute-api.ap-southeast-1.amazonaws.com/prod/prices',
    timeout: 10000
};

export const account: Account = getAccount()

const getMode = (): AgentMode => {
    const config = getEnvironmentConfig();
    return config.agentMode;
}

export const agentMode: AgentMode = getMode()

const baseConfig = {
    chain: networkInfo.chain,
    transport: http(networkInfo.rpcProviderUrl),
} as const;

export const publicClient = createPublicClient(baseConfig);

export const walletClient = createWalletClient({
    ...baseConfig,
    account,
}) as WalletClient;

// Multi-chain client factory
export function createClientForNetwork(networkType: NetworkType) {
    const config = networkConfigs[networkType];
    const baseConfig = {
        chain: config.chain,
        transport: http(config.rpcProviderUrl),
    };

    return {
        publicClient: createPublicClient(baseConfig),
        walletClient: createWalletClient({
            ...baseConfig,
            account,
        }) as WalletClient,
        networkInfo: config
    };
}

// Get contract addresses for a network
export function getContractAddresses(networkType: NetworkType) {
    return CONTRACT_ADDRESSES[networkType];
}


// Export network configs for external use
export { networkConfigs, CONTRACT_ADDRESSES, type NetworkType };


// DragonSwap V3 Contract Addresses on Kaia Mainnet
export const DRAGONSWAP_CONTRACTS = {
    // Core V3 Contracts
    swapRouter: "0xA324880f884036E3d21a09B90269E1aC57c7EC8a" as Address,
    factory: "0x7431A23897ecA6913D5c81666345D39F27d946A4" as Address,
    poolDeployer: "0x76d724e959D3013b5BB7d2593eb5121Ac004FF17" as Address,
    
    // Quoting and Routing
    quoterV2: "0x673d88960D320909af24db6eE7665aF223fec060" as Address,
    smartRouter: "0x5EA3e22C41B08DD7DC7217549939d987ED410354" as Address,
    mixedRouteQuoterV1: "0xa36aAf0Ae4E2a91B0ebf0bFE938AD3F55f8D4Ee4" as Address,
    
    // Position Management
    nonfungiblePositionManager: "0x68f762d28CebaD501c090949e4680697e56848fC" as Address,
    tickLens: "0xF391524391932d74380698c8cbC036208AFBa306" as Address,
    v3Migrator: "0xF88764c81F4D56Fc5FfdAA14805CC66C45063fD0" as Address,
    
    // Utilities
    multicall: "0x856B344c81f5bf5e6b7f84e1380ef7baC42B2542" as Address,
    multicallV2: "0xCFA1710d22f5d6FDC06a9Ec37cC362eAD041A4E9" as Address,
    
    // Farming (MasterChef V3)
    masterChefV3: "0x6AC953CAD04b0Ce38a454f17D1d92620e456c9C0" as Address,
    v3LmPoolDeployer: "0xf6310D6Be23a2be1891b0849F4fAf4F6C271a1FD" as Address,
    
    // Legacy V2 (for mixed routes)
    pancakeV2Factory: "0x224302153096E3ba16c4423d9Ba102D365a94B2B" as Address,
    pancakeV2Router: "0x8203cBc504CE43c3Cad07Be0e057f25B1d4DB578" as Address,
} as const;

// Common Token Addresses on Kaia
export const SWAP_TOKENS = {
    // Native
    KAIA: "0x0000000000000000000000000000000000000000" as Address,
    WKAIA: "0x19aac5f612f524b754ca7e7c41cbfa2e981a4432" as Address, // Wrapped KAIA 
    WKAI: "0x19aac5f612f524b754ca7e7c41cbfa2e981a4432" as Address, // Alias for WKAIA
    
    // Major Tokens
    USDT_OFFICIAL: "0xd077a400968890eacc75cdc901f0356c943e4fdb" as Address, // Official USDT  
    USDT_WORMHOLE: "0x5c13e303a62fc5dedf5b52d66873f2e59fedadc2" as Address, // Wormhole USDT  
    USDT: "0xd077a400968890eacc75cdc901f0356c943e4fdb" as Address, // Default to Official USDT  
     
    BORA: "0x02cbE46fB8A1F579254a9B485788f2D86Cad51aa" as Address,
    SIX: "0xEf82b1C6A550e730D8283E1eDD4977cd01FAF435" as Address,
    MBX: "0xD068c52d81f4409B9502dA926aCE3301cc41f623" as Address,
    STAKED_KAIA: "0x42952B873ed6f7f0A7E4992E2a9818E3A9001995" as Address,
    RKLAY: "0xf898c138f9c8825cef83ca75535ed77100497296" as Address,
} as const;

// DragonSwap Token Addresses
export const TOKENS = SWAP_TOKENS;

// Fee Tiers for V3 Pools
export const FEE_TIERS = {
    LOWEST: 100,      // 0.01%
    LOW: 500,         // 0.05%
    MEDIUM: 1000,     // 0.1%  
    HIGH: 3000,       // 0.3%
    HIGHEST: 10000,   // 1%
} as const;

// Default Slippage Tolerance (in basis points)
export const DEFAULT_SLIPPAGE = 50; // 0.5%

// Default Transaction Deadline (in minutes)
export const DEFAULT_DEADLINE = 20;

// Pool Creation Constants
export const POOL_CONSTANTS = {
    MIN_TICK: -887272,
    MAX_TICK: 887272,
    TICK_SPACING: {
        100: 1,
        500: 10,
        1000: 20,      // 0.1% fee tier tick spacing
        3000: 60,
        10000: 200,
    },
} as const;
