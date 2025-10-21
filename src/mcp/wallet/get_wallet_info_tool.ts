import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetWalletInfoTool: McpTool = {
    name: "kaia_get_wallet_info",
    description: "Get wallet address and basic account information",
    schema: {
        private_key: z.string()
            .optional()
            .describe("Private key for wallet access (optional, only needed for detailed wallet info)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Create a new WalletAgent with private key if provided
            const walletAgent = input.private_key ? new WalletAgent(input.private_key) : agent;
            
            const walletInfo = await walletAgent.getWalletInfo();
            const nativeCurrency = "KAIA"; // Fixed for KAIA network
            const balanceInNative = parseFloat(walletInfo.nativeBalance.split(' ')[0]);

            return {
                status: "success",
                message: "✅ Wallet information retrieved successfully",
                wallet_details: walletInfo,
                account_status: {
                    activated: true,
                    minimum_balance_required: `0.01 ${nativeCurrency}`,
                    can_supply: balanceInNative >= 0.01,
                    ready_for_operations: balanceInNative >= 0.001
                },
                recommendations: balanceInNative < 0.01
                    ? [
                        `⚠️ Low ${nativeCurrency} balance detected`,
                        `Fund wallet with at least 0.01 ${nativeCurrency} for KAIA-MCP operations`,
                        "Gas fees required for all KAIA-MCP Protocol operations",
                        `Current balance: ${walletInfo.nativeBalance}`
                    ]
                    : [
                        "✅ Wallet has sufficient balance for operations",
                        "Ready to supply assets to KAIA-MCP",
                        "Ready to borrow from KAIA-MCP markets"
                    ]
            };
        } catch (error: any) {
            throw new Error(`Failed to get wallet info: ${error.message}`);
        }
    }
};
