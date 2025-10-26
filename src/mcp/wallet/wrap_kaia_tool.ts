import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const WrapKaiaTool: McpTool = {
    name: "kaia_wrap_kaia",
    description: "Wrap native KAIA tokens to get WKAIA (Wrapped KAIA)",
    schema: {
        amount: z.string()
            .describe("Amount of KAIA to wrap in KAIA units")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.wrapKaia(input.amount);

            return {
                status: "success",
                message: "✅ KAIA wrapped successfully",
                transaction_hash: txHash,
                details: {
                    amount_wrapped: input.amount,
                    wrapped_token: "WKAIA",
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                },
                recommendations: [
                    "Save the transaction hash for reference",
                    "Wait for transaction confirmation",
                    "Check your WKAIA balance after confirmation"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to wrap KAIA: ${error.message}`);
        }
    }
};
