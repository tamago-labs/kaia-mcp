import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const RedeemUnderlyingTool: McpTool = {
    name: "kilolend_redeem_underlying",
    description: "Redeem underlying tokens from a KiloLend lending market (specify underlying token amount)",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to redeem (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        underlying_amount: z.string()
            .describe("Amount of underlying tokens to redeem")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.redeemUnderlying(
                input.token_symbol,
                input.underlying_amount
            );

            return {
                status: "success",
                message: "✅ Underlying tokens redeemed successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: input.token_symbol,
                    underlying_amount: input.underlying_amount,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to redeem underlying tokens: ${error.message}`);
        }
    }
};
