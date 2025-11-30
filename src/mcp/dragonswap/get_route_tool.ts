import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { SWAP_TOKENS } from "../../config";

/**
 * Get the best route for swapping tokens (supports multi-hop routing)
 */
export const GetRouteTool: McpTool = {
  name: "dragonswap_get_route",
  description: "Get the best routing path for swapping tokens (supports multi-hop for better prices) on DragonSwap V3 DEX",
  schema: {
    tokenIn: z.string()
      .describe("Input token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"),
    tokenOut: z.string()
      .describe("Output token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"),
    amountIn: z.string()
      .describe("Amount of input tokens to swap (in human-readable format, e.g., '1.5')"),
    amountInDecimals: z.number()
      .optional()
      .default(18)
      .describe("Number of decimals for the input token (default: 18)")
  },
  handler: async (agent: WalletAgent, input: Record<string, any>) => {
    try {
      const {
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals = 18
      } = input;

      // Validate parameters
      if (!tokenIn || !tokenOut || !amountIn) {
        throw new Error("Missing required parameters: tokenIn, tokenOut, and amountIn are required");
      }

      if (isNaN(parseFloat(amountIn)) || parseFloat(amountIn) <= 0) {
        throw new Error("Invalid amountIn: must be a positive number");
      }

      // Get direct route first
      const directRoute = await agent.getBestRoute({
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals
      });

      // For now, implement basic multi-hop routing
      // In a full implementation, we would check multiple intermediate tokens
      const multiHopRoutes = await findMultiHopRoutes(agent, tokenIn, tokenOut, amountIn, amountInDecimals);

      // Compare routes and find the best one
      const allRoutes = [directRoute, ...multiHopRoutes];
      const bestRoute = allRoutes.reduce((best, current) => {
        const bestOutput = parseFloat(best.quote.amountOutFormatted);
        const currentOutput = parseFloat(current.quote.amountOutFormatted);
        return currentOutput > bestOutput ? current : best;
      });

      return {
        status: "success",
        message: "✅ Best route found successfully",
        bestRoute: {
          type: bestRoute.type,
          route: bestRoute.route,
          quote: {
            tokenIn: bestRoute.quote.tokenInSymbol,
            tokenOut: bestRoute.quote.tokenOutSymbol,
            amountIn: bestRoute.quote.amountInFormatted,
            amountOut: bestRoute.quote.amountOutFormatted,
            estimatedPrice: bestRoute.quote.estimatedPrice,
            gasEstimate: bestRoute.gasEstimate
          },
          savings: calculateSavings(directRoute, bestRoute)
        },
        comparison: {
          directRoute: {
            type: directRoute.type,
            amountOut: directRoute.quote.amountOutFormatted,
            gasEstimate: directRoute.gasEstimate
          },
          multiHopRoutes: multiHopRoutes.map(route => ({
            type: route.type,
            amountOut: route.quote.amountOutFormatted,
            gasEstimate: route.gasEstimate,
            path: route.route?.pools?.map((p: any) => `${p.token0}/${p.token1}`).join(' → ') || 'Direct'
          })),
          totalRoutes: allRoutes.length
        },
        insights: [
          `🎯 Best route: ${bestRoute.type}`,
          `💰 Output: ${bestRoute.quote.amountOutFormatted} ${bestRoute.quote.tokenOutSymbol}`,
          `⛽ Gas estimate: ${bestRoute.gasEstimate}`,
          multiHopRoutes.length > 0 ? `🔄 ${multiHopRoutes.length} multi-hop routes evaluated` : "📍 Only direct route available",
          bestRoute.type === 'multi-hop' ? "🚀 Multi-hop routing provides better output!" : "📍 Direct route is optimal"
        ],
        recommendations: [
          "Use the best route for maximum output",
          "Consider gas costs for multi-hop routes",
          "Check liquidity for each hop in multi-hop routes",
          "Monitor slippage for complex routes"
        ]
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `❌ Failed to get route: ${error.message}`,
        error: error.message,
        suggestions: [
          "Verify token addresses are correct",
          "Check if tokens have sufficient liquidity",
          "Try smaller amounts for testing",
          "Ensure tokens are supported on DragonSwap"
        ]
      };
    }
  }
};

async function findMultiHopRoutes(agent: WalletAgent, tokenIn: string, tokenOut: string, amountIn: string, amountInDecimals: number): Promise<any[]> {
  const routes = [];
  
  // Common intermediate tokens for routing
  const intermediateTokens = ['USDT', 'KAIA', 'USDC', 'WKAIA'];
  
  for (const intermediate of intermediateTokens) {
    // Skip if intermediate is same as input or output
    if (intermediate === tokenIn.toUpperCase() || intermediate === tokenOut.toUpperCase()) {
      continue;
    }
    
    try {
      // Try route: tokenIn → intermediate → tokenOut
      const firstHop = await agent.getBestRoute({
        tokenIn,
        tokenOut: intermediate,
        amountIn,
        amountInDecimals
      });
      
      if (firstHop && parseFloat(firstHop.quote.amountOutFormatted) > 0) {
        const secondHop = await agent.getBestRoute({
          tokenIn: intermediate,
          tokenOut,
          amountIn: firstHop.quote.amountOutFormatted,
          amountInDecimals: 18 // Assume 18 decimals for intermediate
        });
        
        if (secondHop && parseFloat(secondHop.quote.amountOutFormatted) > 0) {
          routes.push({
            type: 'multi-hop',
            route: {
              pools: [
                ...firstHop.route?.pools || [],
                ...secondHop.route?.pools || []
              ]
            },
            quote: {
              ...secondHop.quote,
              tokenInSymbol: firstHop.quote.tokenInSymbol,
              amountInFormatted: firstHop.quote.amountInFormatted,
              estimatedPrice: parseFloat(secondHop.quote.amountOutFormatted) / parseFloat(firstHop.quote.amountInFormatted)
            },
            gasEstimate: (parseInt(firstHop.gasEstimate || '0') + parseInt(secondHop.gasEstimate || '0')).toString(),
            path: `${firstHop.quote.tokenInSymbol} → ${intermediate} → ${secondHop.quote.tokenOutSymbol}`
          });
        }
      }
    } catch (error) {
      // Skip failed routes
      continue;
    }
  }
  
  return routes;
}

function calculateSavings(directRoute: any, bestRoute: any): any {
  const directOutput = parseFloat(directRoute.quote.amountOutFormatted);
  const bestOutput = parseFloat(bestRoute.quote.amountOutFormatted);
  
  if (bestOutput > directOutput) {
    const savings = bestOutput - directOutput;
    const savingsPercent = (savings / directOutput) * 100;
    
    return {
      amount: savings.toString(),
      percent: savingsPercent.toFixed(2),
      isBetter: true,
      message: `Multi-hop routing saves ${savingsPercent.toFixed(2)}% more output`
    };
  }
  
  return {
    amount: "0",
    percent: "0.00",
    isBetter: false,
    message: "Direct route is optimal"
  };
}
