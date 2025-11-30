import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetAccountLiquidityTool: McpTool = {
    name: "kilolend_get_account_liquidity",
    description: "Check account liquidity, health factor, and borrowing capacity on KiloLend",
    schema: {
        account_address: z.string()
            .optional()
            .describe("Account address to check (optional, defaults to current wallet)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Get the account address - use provided address or get from wallet
            let accountAddress = input.account_address;
            if (!accountAddress) {
                const walletAddress = agent.getAddress();
                if (!walletAddress) {
                    throw new Error('No account address provided and no wallet available. Please provide account_address or configure private key in environment.');
                }
                accountAddress = walletAddress;
            }
            
            const liquidityInfo = await agent.getAccountLiquidity(accountAddress as any);

            return {
                status: "success",
                message: "✅ Account liquidity information retrieved",
                account_address: accountAddress,
                liquidity_info: {
                    liquidity: Number(liquidityInfo.liquidity).toFixed(6),
                    shortfall: Number(liquidityInfo.shortfall).toFixed(6),
                    health_factor: Number(liquidityInfo.healthFactor).toFixed(2),
                    can_borrow: Number(liquidityInfo.liquidity) > 0 && Number(liquidityInfo.shortfall) === 0,
                    at_risk_liquidation: Number(liquidityInfo.healthFactor) < 1.4
                },
                positions: liquidityInfo.positions,
                recommendations: Number(liquidityInfo.shortfall) > 0
                    ? [
                        "⚠️ Account has shortfall - at risk of liquidation",
                        "Repay borrowed assets or supply more collateral",
                        "Consider reducing borrowed positions"
                    ]
                    : Number(liquidityInfo.healthFactor) < 1.4
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
