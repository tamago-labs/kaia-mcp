import { z } from "zod";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { dragonSwapRouter } from "../../dragonswap/router";
import { TOKENS } from "../../dragonswap/config";
import { formatUnits } from "viem";

/**
 * Get a swap quote from DragonSwap V3
 */
export const GetSwapQuoteTool: Tool = {
  name: "get_dragonswap_quote",
  description: "Get a quote for swapping tokens on DragonSwap V3 DEX",
  inputSchema: {
    type: "object",
    properties: {
      tokenIn: {
        type: "string",
        description: "Input token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"
      },
      tokenOut: {
        type: "string", 
        description: "Output token address or symbol (e.g., 'KAIA', 'USDT', '0x1234...')"
      },
      amountIn: {
        type: "string",
        description: "Amount of input tokens to swap (in human-readable format, e.g., '1.5')"
      },
      amountInDecimals: {
        type: "number",
        description: "Number of decimals for the input token (default: 18)",
        default: 18
      },
      slippage: {
        type: "number",
        description: "Slippage tolerance in basis points (e.g., 50 = 0.5%)",
        default: 50
      }
    },
    required: ["tokenIn", "tokenOut", "amountIn"]
  }
};

export async function handleGetSwapQuote(args: any) {
  try {
    // Parse token symbols to addresses
    const tokenIn = parseTokenSymbol(args.tokenIn);
    const tokenOut = parseTokenSymbol(args.tokenOut);

    // Get swap quote
    const quote = await dragonSwapRouter.getQuoteExactInput({
      tokenIn,
      tokenOut,
      amountIn: args.amountIn,
      amountInDecimals: args.amountInDecimals || 18,
      slippage: args.slippage || 50
    });

    // Get current balances for context
    const balanceIn = await dragonSwapRouter.getTokenBalance(tokenIn);
    const balanceOut = await dragonSwapRouter.getTokenBalance(tokenOut);

    return {
      success: true,
      quote: {
        ...quote,
        tokenInSymbol: getTokenSymbol(args.tokenIn),
        tokenOutSymbol: getTokenSymbol(args.tokenOut),
        currentBalanceIn: balanceIn,
        currentBalanceOut: balanceOut,
        estimatedPrice: parseFloat(quote.amountOutFormatted) / parseFloat(quote.amountInFormatted)
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
