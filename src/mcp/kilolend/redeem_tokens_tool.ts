import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const RedeemTokensTool: McpTool = {
    name: "kilolend_redeem_tokens",
    description: "Redeem cTokens to withdraw underlying tokens from a KiloLend lending market (specify cToken amount)",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to redeem (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        ctoken_amount: z.string()
            .describe("Amount of cTokens to redeem (cTokens use 8 decimals)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.redeemTokens(
                input.token_symbol,
                input.ctoken_amount
            );

            return {
                status: "success",
                message: "✅ cTokens redeemed successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: input.token_symbol,
                    ctoken_amount: input.ctoken_amount,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to redeem cTokens: ${error.message}`);
        }
    }
};
