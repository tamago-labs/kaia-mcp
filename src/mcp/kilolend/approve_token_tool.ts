import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";
import { SYMBOL_TO_CTOKEN } from "../../contracts/ctoken";

export const ApproveTokenTool: McpTool = {
    name: "kilolend_approve_token",
    description: "Approve token for KiloLend operations",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to approve (e.g., USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        amount: z.string()
            .optional()
            .describe("Amount to approve (optional, defaults to max uint256)"),
        spender_address: z.string()
            .optional()
            .describe("Spender address to approve for (optional, defaults to cToken address)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }

            const tokenSymbol = input.token_symbol.toUpperCase();
            
            // Default to cToken address if no spender specified
            let spenderAddress = input.spender_address;
            if (!spenderAddress) {
                const cTokenAddress = SYMBOL_TO_CTOKEN[tokenSymbol as keyof typeof SYMBOL_TO_CTOKEN];
                if (!cTokenAddress) {
                    throw new Error(`Market ${tokenSymbol} not available`);
                }
                spenderAddress = cTokenAddress;
            }

            const txHash = await agent.approveToken(
                tokenSymbol,
                spenderAddress as `0x${string}`,
                input.amount
            );

            return {
                status: "success",
                message: "✅ Token approved successfully",
                transaction_hash: txHash,
                details: {
                    token_symbol: tokenSymbol,
                    spender_address: spenderAddress,
                    amount: input.amount || 'max uint256',
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to approve token: ${error.message}`);
        }
    }
};
