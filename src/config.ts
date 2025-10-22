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
        return privateKeyToAccount(formattedPrivateKey as Address);
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

// Multi-chain client factory (for future extensibility)
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
