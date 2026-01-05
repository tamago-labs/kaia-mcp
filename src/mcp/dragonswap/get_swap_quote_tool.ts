import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

/**
 * Get a swap quote from DragonSwap V3
 */
export const GetSwapQuoteTool: McpTool = {
  name: "dragonswap_get_quote",
    description: "Get a quote for swapping tokens on DragonSwap V3 DEX. Note: USDT uses 6 decimals, most other tokens use 18 decimals. For stKAIA, you can use either 'stKAIA' or 'STAKED_KAIA'.",
    schema: {
      tokenIn: z.string()
        .describe("Input token address or symbol (e.g., 'KAIA', 'USDT', 'stKAIA', '0x1234...')"),
      tokenOut: z.string()
        .describe("Output token address or symbol (e.g., 'KAIA', 'USDT', 'stKAIA', '0x1234...')"),
      amountIn: z.string()
        .describe("Amount of input tokens to swap (in human-readable format, e.g., '1.5')"),
      amountInDecimals: z.number()
        .optional()
        .describe("Number of decimals for the input token (auto-detected if not provided, USDT=6, most tokens=18)"),
      slippage: z.number()
        .optional()
        .default(50)
        .describe("Slippage tolerance in basis points (e.g., 50 = 0.5%)")
    },
  handler: async (agent: WalletAgent, input: Record<string, any>) => {
    try {
      const {
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals = 18,
        slippage = 50
      } = input;

      // Validate parameters
      if (!tokenIn || !tokenOut || !amountIn) {
        throw new Error("Missing required parameters: tokenIn, tokenOut, and amountIn are required");
      }

      if (isNaN(parseFloat(amountIn)) || parseFloat(amountIn) <= 0) {
        throw new Error("Invalid amountIn: must be a positive number");
      }

      if (slippage < 0 || slippage > 5000) {
        throw new Error("Invalid slippage: must be between 0 and 5000 basis points (0-50%)");
      }

      // Get swap quote from agent
      const quote = await agent.getSwapQuote({
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals,
        slippage
      });

      return {
        status: "success",
        message: "✅ Swap quote retrieved successfully",
        quote: {
          tokenIn: quote.tokenInSymbol,
          tokenOut: quote.tokenOutSymbol,
          tokenInAddress: quote.tokenIn,
          tokenOutAddress: quote.tokenOut,
          amountIn: quote.amountInFormatted,
          amountOut: quote.amountOutFormatted,
          amountOutMin: quote.amountOutFormatted,
          estimatedPrice: quote.estimatedPrice,
          slippage: `${slippage / 100}%`,
          currentBalanceIn: quote.currentBalanceIn,
          currentBalanceOut: quote.currentBalanceOut,
          route: quote.route,
          // priceImpact: quote.priceImpact || "N/A"
        },
        insights: {
          canSwap: parseFloat(quote.currentBalanceIn) >= parseFloat(quote.amountInFormatted),
          balanceSufficient: parseFloat(quote.currentBalanceIn) >= parseFloat(quote.amountInFormatted),
          recommendedSlippage: slippage < 50 ? "Consider increasing slippage to 100-200 bps for better success rate" : "Slippage setting is reasonable"
        }
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `❌ Failed to get swap quote: ${error.message}`,
        error: error.message
      };
    }
  }
};
