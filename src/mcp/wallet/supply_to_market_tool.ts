import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const SupplyToMarketTool: McpTool = {
    name: "kaia_supply_to_lending",
    description: "Supply tokens to a KAIA-MCP lending market",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to supply (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        amount: z.string()
            .describe("Amount to supply"),
        private_key: z.string()
            .optional()
            .describe("Private key for transaction (required for supplying)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Create a new WalletAgent with private key for transactions
            const walletAgent = input.private_key ? new WalletAgent(input.private_key) : agent;
            
            if (!walletAgent.isTransactionMode()) {
                throw new Error('Transaction mode required. Provide private_key parameter.');
            }
            
            const txHash = await walletAgent.supplyToMarket(
                input.token_symbol,
                input.amount
            );

            return {
                status: "success",
                message: "✅ Tokens supplied to market successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: input.token_symbol,
                    amount: input.amount,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to supply to market: ${error.message}`);
        }
    }
};
