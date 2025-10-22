import { Address } from 'viem';

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
export const TOKENS = {
    // Native
    KAIA: "0x0000000000000000000000000000000000000000" as Address,
    WKAI: "0x3a8B8E5395787622360e5348C8C93b432e5F2A6B" as Address, // Wrapped KAIA
    
    // Major Tokens
    USDT: "0x5C13E303a62Fc5DEdf5B52D66873f2E59fEdADC2" as Address,
    USDC: "0x5c7F8A570d578ED84E63fdFA7b1eE72dE1a1476A" as Address,
    BORA: "0x02cbE46fB8A1F579254a9B485788f2D86Cad51aa" as Address,
    SIX: "0xEf82b1C6A550e730D8283E1eDD4977cd01FAF435" as Address,
    MBX: "0xD068c52d81f4409B9502dA926aCE3301cc41f623" as Address,
    STAKED_KAIA: "0x42952B873ed6f7f0A7E4992E2a9818E3A9001995" as Address,
    RKLAY: "0xf898c138f9c8825cef83ca75535ed77100497296" as Address,
} as const;

// Fee Tiers for V3 Pools
export const FEE_TIERS = {
    LOWEST: 100,      // 0.01%
    LOW: 500,         // 0.05%
    MEDIUM: 3000,     // 0.3%
    HIGH: 10000,      // 1%
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
        3000: 60,
        10000: 200,
    },
} as const;
