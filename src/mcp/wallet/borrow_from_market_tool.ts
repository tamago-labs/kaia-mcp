import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const BorrowFromMarketTool: McpTool = {
    name: "kaia_borrow_from_lending",
    description: "Borrow tokens from a KAIA-MCP lending market",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to borrow (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        amount: z.string()
            .describe("Amount to borrow"),
        private_key: z.string()
            .optional()
            .describe("Private key for transaction (required for borrowing)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Create a new WalletAgent with private key for transactions
            const walletAgent = input.private_key ? new WalletAgent(input.private_key) : agent;
            
            if (!walletAgent.isTransactionMode()) {
                throw new Error('Transaction mode required. Provide private_key parameter.');
            }
            
            const txHash = await walletAgent.borrowFromMarket(
                input.token_symbol,
                input.amount
            );

            return {
                status: "success",
                message: "✅ Tokens borrowed from market successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: input.token_symbol,
                    amount: input.amount,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to borrow from market: ${error.message}`);
        }
    }
};
