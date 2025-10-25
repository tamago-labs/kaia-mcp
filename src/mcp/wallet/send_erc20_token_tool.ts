import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";

export const SendERC20TokenTool: McpTool = {
    name: "kaia_send_erc20_token",
    description: "Send ERC-20 tokens to another address",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to send (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        to_address: z.string()
            .describe("Recipient address"),
        amount: z.string()
            .describe("Amount to send")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }
            
            const txHash = await agent.sendERC20Token(
                input.token_symbol,
                input.to_address as any,
                input.amount
            );

            return {
                status: "success",
                message: "✅ ERC-20 tokens sent successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: input.token_symbol,
                    to_address: input.to_address,
                    amount: input.amount,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to send ERC-20 tokens: ${error.message}`);
        }
    }
};
