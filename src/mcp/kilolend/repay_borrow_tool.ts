import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const RepayBorrowTool: McpTool = {
    name: "kaia_repay_lending",
    description: "Repay borrowed tokens to a KAIA-MCP lending market",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to repay (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        amount: z.string()
            .optional()
            .describe("Amount to repay (optional, defaults to full amount)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.repayBorrow(
                input.token_symbol,
                input.amount
            );

            return {
                status: "success",
                message: "✅ Borrow repaid successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: input.token_symbol,
                    amount: input.amount || 'full amount',
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to repay borrow: ${error.message}`);
        }
    }
};
