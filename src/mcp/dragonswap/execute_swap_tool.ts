import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

/**
 * Execute a token swap on DragonSwap V3
 */
export const ExecuteSwapTool: McpTool = {
  name: "dragonswap_execute_swap",
    description: "Execute a token swap on DragonSwap V3 DEX. Note: USDT uses 6 decimals, most other tokens use 18 decimals. For stKAIA, you can use either 'stKAIA' or 'STAKED_KAIA'.",
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
        .describe("Slippage tolerance in basis points (e.g., 50 = 0.5%)"),
      recipient: z.string()
        .optional()
        .describe("Recipient address (default: current wallet address)"),
      deadline: z.number()
        .optional()
        .default(20)
        .describe("Transaction deadline in minutes (default: 20)")
    },
  handler: async (agent: WalletAgent, input: Record<string, any>) => {
    try {
      const {
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals = 18,
        slippage = 50,
        recipient,
        deadline = 20
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

      if (deadline < 1 || deadline > 60) {
        throw new Error("Invalid deadline: must be between 1 and 60 minutes");
      }

      // Check if agent is in transaction mode
      if (!agent.isTransactionMode()) {
        throw new Error("This operation requires transaction mode. Please provide a private key.");
      }

      // Get quote first to show user what they're getting
      const quote = await agent.getSwapQuote({
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals,
        slippage
      });

      // Check if user has sufficient balance
      if (parseFloat(quote.currentBalanceIn) < parseFloat(quote.amountInFormatted)) {
        throw new Error(`Insufficient balance. You have ${quote.currentBalanceIn} ${quote.tokenInSymbol} but trying to swap ${quote.amountInFormatted} ${quote.tokenInSymbol}`);
      }

      // Execute the swap
      const txHash = await agent.executeSwap({
        tokenIn,
        tokenOut,
        amountIn,
        amountInDecimals,
        slippage,
        recipient,
        deadline
      });

      return {
        status: "success",
        message: "✅ Swap executed successfully",
        transaction: {
          hash: txHash,
          explorerUrl: `https://www.kaiascan.io/tx/${txHash}`,
          tokenIn: quote.tokenInSymbol,
          tokenOut: quote.tokenOutSymbol,
          amountIn: quote.amountInFormatted,
          amountOut: quote.amountOutFormatted,
          amountOutMin: quote.amountOutFormatted,
          slippage: `${slippage / 100}%`,
          recipient: recipient || agent.getAddress(),
          deadline: `${deadline} minutes`
        },
        quote: {
          estimatedPrice: quote.estimatedPrice,
          currentBalanceIn: quote.currentBalanceIn,
          currentBalanceOut: quote.currentBalanceOut,
          route: quote.route
        },
        nextSteps: [
          `🔍 View transaction: https://www.kaiascan.io/tx/${txHash}`,
          `⏳ Wait for confirmation (usually 1-2 minutes on KAIA)`,
          `💰 Check your ${quote.tokenOutSymbol} balance after confirmation`
        ]
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `❌ Failed to execute swap: ${error.message}`,
        error: error.message,
        suggestions: [
          "Ensure you have sufficient balance for the swap",
          "Check if the token pair has enough liquidity",
          "Try increasing slippage tolerance",
          "Verify your wallet has enough KAIA for gas fees",
          "Make sure your private key is correctly configured"
        ]
      };
    }
  }
};
