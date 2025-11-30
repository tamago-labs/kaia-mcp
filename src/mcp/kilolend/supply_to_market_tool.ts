import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const SupplyToMarketTool: McpTool = {
    name: "kilolend_supply_to_lending",
    description: "Supply tokens to a KiloLend lending market",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to supply (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        amount: z.string()
            .describe("Amount to supply")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.supplyToMarket(
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
