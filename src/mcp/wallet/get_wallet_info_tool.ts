import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetWalletInfoTool: McpTool = {
    name: "kaia_get_wallet_info",
    description: "Get comprehensive wallet information including all token balances",
    schema: {},
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const walletInfo = await agent.getWalletInfo();
            const nativeCurrency = "KAIA"; // Fixed for KAIA network
            const balanceInNative = parseFloat(walletInfo.nativeBalance.split(' ')[0]);
            const totalPortfolioUSD = parseFloat(walletInfo.totalPortfolioUSD || '0');

            // Format token balances for display
            const tokenBalances = walletInfo.tokens.map((token: any) => ({
                symbol: token.symbol,
                balance: parseFloat(token.balance).toFixed(6),
                balanceUSD: `$${token.balanceUSD}`,
                price: token.price ? `$${token.price.toFixed(6)}` : 'N/A',
                address: token.address
            }));

            // Generate recommendations based on portfolio
            const recommendations = [];
            
            if (balanceInNative < 0.01) {
                recommendations.push(
                    `⚠️ Low ${nativeCurrency} balance detected`,
                    `Fund wallet with at least 0.01 ${nativeCurrency} for KAIA-MCP operations`,
                    "Gas fees required for all KAIA-MCP Protocol operations",
                    `Current balance: ${walletInfo.nativeBalance}`
                );
            } else {
                recommendations.push(
                    "✅ Wallet has sufficient balance for operations",
                    "Ready to supply assets to KAIA-MCP",
                    "Ready to borrow from KAIA-MCP markets"
                );
            }

            if (totalPortfolioUSD > 0) {
                recommendations.push(
                    `💰 Total portfolio value: $${totalPortfolioUSD.toFixed(2)} USD`,
                    `🪙 Holding ${walletInfo.tokens.length} different tokens`
                );
            }

            // Check for WKAIA balance specifically
            const wkaiaToken = walletInfo.tokens.find((t: any) => t.symbol === 'WKAIA');
            if (wkaiaToken && parseFloat(wkaiaToken.balance) > 0) {
                recommendations.push(
                    `🔄 WKAIA detected: ${wkaiaToken.balance} WKAIA ($${wkaiaToken.balanceUSD})`,
                    "You can unwrap WKAIA to get native KAIA if needed"
                );
            }

            return {
                status: "success",
                message: "✅ Comprehensive wallet information retrieved successfully",
                wallet_details: {
                    ...walletInfo,
                    tokenBalances
                },
                account_status: {
                    activated: true,
                    minimum_balance_required: `0.01 ${nativeCurrency}`,
                    can_supply: balanceInNative >= 0.01,
                    ready_for_operations: balanceInNative >= 0.001,
                    total_portfolio_usd: totalPortfolioUSD,
                    token_count: walletInfo.tokens.length
                },
                portfolio_summary: {
                    total_value_usd: `$${totalPortfolioUSD.toFixed(2)}`,
                    native_balance: walletInfo.nativeBalance,
                    native_balance_usd: `$${walletInfo.nativeBalanceUSD}`,
                    token_count: walletInfo.tokens.length,
                    has_wkaia: !!wkaiaToken,
                    top_tokens: tokenBalances.slice(0, 5) // Top 5 tokens by value
                },
                recommendations
            };
        } catch (error: any) {
            throw new Error(`Failed to get wallet info: ${error.message}`);
        }
    }
};
