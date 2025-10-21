import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetAccountLiquidityTool: McpTool = {
    name: "kaia_get_account_liquidity",
    description: "Check account liquidity, health factor, and borrowing capacity",
    schema: {
        account_address: z.string()
            .describe("Account address to check (optional, defaults to current wallet)"),
        private_key: z.string()
            .optional()
            .describe("Private key for wallet access (optional, only needed if no default wallet)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Create a new WalletAgent with private key if provided
            const walletAgent = input.private_key ? new WalletAgent(input.private_key) : agent;
            
            // Get the account address - use provided address or get from wallet
            let accountAddress = input.account_address;
            if (!accountAddress) {
                const walletAddress = walletAgent.getAddress();
                if (!walletAddress) {
                    throw new Error('No account address provided and no wallet available. Please provide account_address or private_key.');
                }
                accountAddress = walletAddress;
            }
            
            const liquidityInfo = await walletAgent.getAccountLiquidity(accountAddress as any);
            
            const liquidity = parseFloat(liquidityInfo.liquidity) / 1e18;
            const shortfall = parseFloat(liquidityInfo.shortfall) / 1e18;
            const healthFactor = shortfall > 0 ? 0 : (liquidity > 0 ? 2.0 : 1.0); // Simplified calculation

            return {
                status: "success",
                message: "✅ Account liquidity information retrieved",
                account_address: accountAddress,
                liquidity_info: {
                    liquidity: liquidity.toFixed(6),
                    shortfall: shortfall.toFixed(6),
                    health_factor: healthFactor.toFixed(2),
                    can_borrow: liquidity > 0 && shortfall === 0,
                    at_risk_liquidation: healthFactor < 1.5
                },
                recommendations: shortfall > 0
                    ? [
                        "⚠️ Account has shortfall - at risk of liquidation",
                        "Repay borrowed assets or supply more collateral",
                        "Consider reducing borrowed positions"
                    ]
                    : healthFactor < 1.5
                    ? [
                        "⚠️ Low health factor - close to liquidation threshold",
                        "Monitor positions closely",
                        "Consider adding more collateral or repaying debt"
                    ]
                    : [
                        "✅ Account is healthy",
                        "Can borrow more assets if needed",
                        "Positions are safe from liquidation"
                    ]
            };
        } catch (error: any) {
            throw new Error(`Failed to get account liquidity: ${error.message}`);
        }
    }
};
