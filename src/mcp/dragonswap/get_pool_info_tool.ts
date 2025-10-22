import { z } from "zod";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { dragonSwapRouter, IDragonSwapRouter, PoolInfo } from "../../dragonswap/router";
import { TOKENS, FEE_TIERS } from "../../dragonswap/config";
import { formatUnits } from "viem";

/**
 * Get pool information for DragonSwap V3
 */
export const GetPoolInfoTool: Tool = {
  name: "get_dragonswap_pool_info",
  description: "Get pool information for a token pair on DragonSwap V3 DEX",
  inputSchema: {
    type: "object",
    properties: {
      token0: {
        type: "string",
        description: "First token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"
      },
      token1: {
        type: "string", 
        description: "Second token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"
      },
      fee: {
        type: "number",
        description: "Fee tier in basis points (100, 500, 1000, 3000, 10000). If not provided, returns all available pools.",
        enum: [100, 500, 1000, 3000, 10000]
      }
    },
    required: ["token0", "token1"]
  }
};

export async function handleGetPoolInfo(args: any, router?: IDragonSwapRouter) {
  try {
    // Use provided router or fall back to imported one
    const routerInstance = router || dragonSwapRouter;
    
    // Parse token symbols to addresses
    const token0 = parseTokenSymbol(args.token0);
    const token1 = parseTokenSymbol(args.token1);

    let pools;
    if (args.fee) {
      // Get specific pool
      const pool = await routerInstance.getPoolInfo(token0, token1, args.fee);
      pools = pool ? [pool] : [];
    } else {
      // Get all pools for the pair
      pools = await routerInstance.getAllPools(token0, token1);
    }

    if (pools.length === 0) {
      return {
        success: true,
        pools: [],
        message: "No pools found for this token pair"
      };
    }

    // Get additional pool data
    const enrichedPools = await Promise.all(
      pools.map(async (pool: PoolInfo) => {
        try {
          // Get token balances for the pool
          const balance0 = await routerInstance.getTokenBalance(pool.token0, pool.address);
          const balance1 = await routerInstance.getTokenBalance(pool.token1, pool.address);

          // Calculate price from sqrtPriceX96 if available
          let price0 = "0";
          let price1 = "0";
          
          if (pool.sqrtPriceX96 && pool.sqrtPriceX96 !== "0") {
            const sqrtPrice = BigInt(pool.sqrtPriceX96);
            // Price = (sqrtPriceX96 / 2^96)^2
            const price = (sqrtPrice * sqrtPrice) / (BigInt(2) ** BigInt(96));
            price0 = formatUnits(price, 18);
            price1 = (1 / parseFloat(price0 || "0")).toString();
          }

          return {
            ...pool,
            token0Symbol: getTokenSymbol(args.token0),
            token1Symbol: getTokenSymbol(args.token1),
            balance0,
            balance1,
            price0,
            price1,
            feeTierName: getFeeTierName(pool.fee),
            liquidityFormatted: formatUnits(BigInt(pool.liquidity), 18)
          };
        } catch (error) {
          return {
            ...pool,
            token0Symbol: getTokenSymbol(args.token0),
            token1Symbol: getTokenSymbol(args.token1),
            balance0: "0",
            balance1: "0",
            price0: "0",
            price1: "0",
            feeTierName: getFeeTierName(pool.fee),
            liquidityFormatted: formatUnits(BigInt(pool.liquidity), 18),
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );

    return {
      success: true,
      pools: enrichedPools,
      tokenPair: {
        token0: getTokenSymbol(args.token0),
        token1: getTokenSymbol(args.token1),
        address0: token0,
        address1: token1
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

function parseTokenSymbol(token: string): `0x${string}` {
  // Check if it's a known token symbol
  const upperToken = token.toUpperCase();
  if (TOKENS[upperToken as keyof typeof TOKENS]) {
    return TOKENS[upperToken as keyof typeof TOKENS] as `0x${string}`;
  }
  
  // Check if it's already an address
  if (token.startsWith('0x') && token.length === 42) {
    return token as `0x${string}`;
  }
  
  throw new Error(`Invalid token address or symbol: ${token}`);
}

function getTokenSymbol(token: string): string {
  const upperToken = token.toUpperCase();
  if (TOKENS[upperToken as keyof typeof TOKENS]) {
    return upperToken;
  }
  
  // If it's an address, return shortened version
  if (token.startsWith('0x') && token.length === 42) {
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  }
  
  return token;
}

function getFeeTierName(fee: number): string {
  switch (fee) {
    case FEE_TIERS.LOWEST:
      return "Lowest (0.01%)";
    case FEE_TIERS.LOW:
      return "Low (0.05%)";
    case FEE_TIERS.MEDIUM:
      return "Medium (0.1%)";
    case FEE_TIERS.HIGH:
      return "High (0.3%)";
    case FEE_TIERS.HIGHEST:
      return "Highest (1%)";
    default:
      return `${fee / 100}%`;
  }
}
