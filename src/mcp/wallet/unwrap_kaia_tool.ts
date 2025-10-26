import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const UnwrapKaiaTool: McpTool = {
    name: "kaia_unwrap_kaia",
    description: "Unwrap WKAIA (Wrapped KAIA) tokens to get native KAIA",
    schema: {
        amount: z.string()
            .describe("Amount of WKAIA to unwrap in WKAIA units")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.unwrapKaia(input.amount);

            return {
                status: "success",
                message: "✅ WKAIA unwrapped successfully",
                transaction_hash: txHash,
                details: {
                    amount_unwrapped: input.amount,
                    unwrapped_token: "KAIA",
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                },
                recommendations: [
                    "Save the transaction hash for reference",
                    "Wait for transaction confirmation",
                    "Check your native KAIA balance after confirmation"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to unwrap WKAIA: ${error.message}`);
        }
    }
};
