import { z } from "zod";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { dragonSwapRouter, IDragonSwapRouter } from "../../dragonswap/router";
import { TOKENS } from "../../dragonswap/config";
import { publicClient } from "../../config";
import { formatUnits, Hex } from "viem";

/**
 * Execute a token swap on DragonSwap V3
 */
export const ExecuteSwapTool: Tool = {
  name: "execute_dragonswap_swap",
  description: "Execute a token swap on DragonSwap V3 DEX (requires private key)",
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
      },
      recipient: {
        type: "string",
        description: "Recipient address (default: wallet address)",
        default: ""
      },
      deadline: {
        type: "number",
        description: "Transaction deadline in minutes (default: 20)",
        default: 20
      }
    },
    required: ["tokenIn", "tokenOut", "amountIn"]
  }
};

export async function handleExecuteSwap(args: any, router?: IDragonSwapRouter) {
  try {
    // Use provided router or fall back to imported one
    const routerInstance = router || dragonSwapRouter;
    
    // Parse token symbols to addresses
    const tokenIn = parseTokenSymbol(args.tokenIn);
    const tokenOut = parseTokenSymbol(args.tokenOut);

    // Parse recipient address
    let recipient: `0x${string}` | undefined;
    if (args.recipient && args.recipient.trim()) {
      if (!args.recipient.startsWith('0x') || args.recipient.length !== 42) {
        throw new Error("Invalid recipient address format");
      }
      recipient = args.recipient as `0x${string}`;
    }

    // Get pre-swap balances
    const balanceBefore = await routerInstance.getTokenBalance(tokenIn);
    const balanceOutBefore = await routerInstance.getTokenBalance(tokenOut);

    // Execute the swap
    const txHash = await routerInstance.executeExactInputSwap({
      tokenIn,
      tokenOut,
      amountIn: args.amountIn,
      amountInDecimals: args.amountInDecimals || 18,
      slippage: args.slippage || 50,
      recipient,
      deadline: args.deadline || 20
    });

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1
    });

    // Get post-swap balances
    const balanceAfter = await routerInstance.getTokenBalance(tokenIn);
    const balanceOutAfter = await routerInstance.getTokenBalance(tokenOut);

    // Calculate actual amounts
    const actualAmountIn = parseFloat(balanceBefore) - parseFloat(balanceAfter);
    const actualAmountOut = parseFloat(balanceOutAfter) - parseFloat(balanceOutBefore);

    return {
      success: true,
      transaction: {
        hash: txHash,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString() || "0",
        status: receipt.status === "success" ? "success" : "failed"
      },
      swapDetails: {
        tokenInSymbol: getTokenSymbol(args.tokenIn),
        tokenOutSymbol: getTokenSymbol(args.tokenOut),
        actualAmountIn: actualAmountIn.toString(),
        actualAmountOut: actualAmountOut.toString(),
        balanceBefore: {
          tokenIn: balanceBefore,
          tokenOut: balanceOutBefore
        },
        balanceAfter: {
          tokenIn: balanceAfter,
          tokenOut: balanceOutAfter
        }
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
