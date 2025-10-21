import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const SendNativeTokenTool: McpTool = {
    name: "kaia_send_native_token",
    description: "Send native KAIA tokens to another address",
    schema: {
        to_address: z.string()
            .describe("Recipient address"),
        amount: z.string()
            .describe("Amount to send in KAIA"),
        private_key: z.string()
            .optional()
            .describe("Private key for transaction (required for sending)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Create a new WalletAgent with private key for transactions
            const walletAgent = input.private_key ? new WalletAgent(input.private_key) : agent;
            
            if (!walletAgent.isTransactionMode()) {
                throw new Error('Transaction mode required. Provide private_key parameter.');
            }
            
            const txHash = await walletAgent.sendNativeToken(
                input.to_address as any,
                input.amount
            );

            return {
                status: "success",
                message: "✅ Native tokens sent successfully",
                transaction_hash: txHash,
                details: {
                    to_address: input.to_address,
                    amount: input.amount,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                },
                recommendations: [
                    "Save the transaction hash for reference",
                    "Wait for transaction confirmation",
                    "Check recipient address to ensure funds arrived"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to send native tokens: ${error.message}`);
        }
    }
};
