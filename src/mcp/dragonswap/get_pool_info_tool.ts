import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { FEE_TIERS } from "../../config";

/**
 * Get pool information for a DragonSwap V3 pool
 */
export const GetPoolInfoTool: McpTool = {
  name: "dragonswap_get_pool_info",
  description: "Get detailed information about a DragonSwap V3 pool",
  schema: {
    token0: z.string()
      .describe("First token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"),
    token1: z.string()
      .describe("Second token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"),
    fee: z.number()
      .optional()
      .default(1000)
      .describe("Fee tier in basis points (100=0.01%, 500=0.05%, 1000=0.1%, 3000=0.3%, 10000=1%)")
  },
  handler: async (agent: WalletAgent, input: Record<string, any>) => {
    try {
      const {
        token0,
        token1,
        fee = 1000
      } = input;

      // Validate parameters
      if (!token0 || !token1) {
        throw new Error("Missing required parameters: token0 and token1 are required");
      }

      // Validate fee tier
      const validFees = Object.values(FEE_TIERS);
      if (!validFees.includes(fee)) {
        throw new Error(`Invalid fee tier. Valid options: ${validFees.join(', ')} basis points`);
      }

      // Get pool info from agent
      const poolInfo = await agent.getPoolInfo(token0, token1, fee);

      if (!poolInfo) {
        return {
          status: "error",
          message: `❌ Pool not found for ${token0}/${token1} with ${fee / 10000}% fee`,
          suggestions: [
            "Try a different fee tier",
            "Check if the token addresses are correct",
            "Verify the tokens are supported on DragonSwap",
            "Consider creating a new pool if you have sufficient liquidity"
          ],
          availableFeeTiers: validFees.map(f => ({
            fee: f,
            name: `${f / 10000}%`,
            description: getFeeTierDescription(f)
          }))
        };
      }

      // Get all pools for comparison
      const allPools = await agent.getAllPools(token0, token1);

      return {
        status: "success",
        message: "✅ Pool information retrieved successfully",
        pool: {
          address: poolInfo.address,
          token0: poolInfo.token0,
          token1: poolInfo.token1,
          fee: poolInfo.fee,
          feeTierName: poolInfo.feeTierName,
          liquidity: poolInfo.liquidity,
          sqrtPriceX96: poolInfo.sqrtPriceX96,
          tick: poolInfo.tick,
          token0Price: poolInfo.token0Price,
          token1Price: poolInfo.token1Price,
          explorerUrl: `https://www.kaiascan.io/address/${poolInfo.address}`
        },
        analysis: {
          hasLiquidity: parseFloat(poolInfo.liquidity) > 0,
          liquidityLevel: getLiquidityLevel(parseFloat(poolInfo.liquidity)),
          priceRatio: parseFloat(poolInfo.token0Price) / parseFloat(poolInfo.token1Price || "1"),
          isActive: poolInfo.tick !== 0
        },
        comparison: {
          totalPools: allPools.length,
          otherFeeTiers: allPools
            .filter(p => p.fee !== fee)
            .map(p => ({
              fee: p.fee,
              feeTierName: p.feeTierName,
              liquidity: p.liquidity,
              hasMoreLiquidity: parseFloat(p.liquidity) > parseFloat(poolInfo.liquidity)
            }))
        },
        insights: [
          `💧 Pool has ${getLiquidityLevel(parseFloat(poolInfo.liquidity))} liquidity`,
          `📊 Current tick: ${poolInfo.tick}`,
          `💱 Price ratio: 1 ${poolInfo.token0} = ${poolInfo.token0Price} ${poolInfo.token1}`,
          allPools.length > 1 ? `🔄 ${allPools.length - 1} other fee tiers available for this pair` : "🎯 Only fee tier available for this pair"
        ]
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `❌ Failed to get pool info: ${error.message}`,
        error: error.message,
        suggestions: [
          "Verify token addresses are correct",
          "Check if tokens are supported on DragonSwap",
          "Try different fee tiers",
          "Ensure you're connected to KAIA mainnet"
        ]
      };
    }
  }
};

function getFeeTierDescription(fee: number): string {
  switch (fee) {
    case FEE_TIERS.LOWEST: return "Best for stable pairs (USDT/USDC)";
    case FEE_TIERS.LOW: return "Good for correlated assets";
    case FEE_TIERS.MEDIUM: return "Standard for most pairs";
    case FEE_TIERS.HIGH: return "For volatile pairs";
    case FEE_TIERS.HIGHEST: return "For exotic pairs";
    default: return "Custom fee tier";
  }
}

function getLiquidityLevel(liquidity: number): string {
  if (liquidity === 0) return "no";
  if (liquidity < 1000000) return "very low";
  if (liquidity < 10000000) return "low";
  if (liquidity < 100000000) return "moderate";
  if (liquidity < 1000000000) return "high";
  return "very high";
}
