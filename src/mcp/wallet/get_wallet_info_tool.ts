import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

// Token memo descriptions
const TOKEN_MEMOS: Record<string, string> = {
    'USDT': 'Official USD₮ from Tether',
    'RKLAY': 'Reward Klay from Dragon swap',
    'WETH': 'Wormhole ETH',
    'STAKED_KAIA' : 'Lair Staked KAIA (stKAIA)'
};

// Protocol information
const SUPPORTED_PROTOCOLS = {
    kilolend: {
        name: 'KiloLend',
        description: 'Lending protocol for supply, borrow, and earn interest',
        operations: ['supply', 'borrow', 'repay', 'redeem', 'check_liquidity'],
        supportedTokens: ['KAIA', 'USDT', 'SIX', 'BORA', 'MBX', 'STAKED_KAIA']
    },
    dragonswap: {
        name: 'DragonSwap V3',
        description: 'Decentralized exchange for token swaps',
        operations: ['swap', 'get_quote', 'pool_info', 'get_route'],
        supportedTokens: ['KAIA', 'WKAIA', 'USDT', 'BORA', 'MBX', 'STAKED_KAIA', 'RKLAY', 'WETH', 'BTCB']
    }
};

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
                address: token.address,
                memo: TOKEN_MEMOS[token.symbol] || null
            }));

            // Generate concise protocol-specific recommendations
            const recommendations = [];
            const userTokens = walletInfo.tokens.map((t: any) => t.symbol);
            const kilolendTokens = userTokens.filter(token => SUPPORTED_PROTOCOLS.kilolend.supportedTokens.includes(token));
            const dragonswapTokens = userTokens.filter(token => SUPPORTED_PROTOCOLS.dragonswap.supportedTokens.includes(token));

            // Balance status
            if (balanceInNative < 0.01) {
                recommendations.push(`⚠️ Low KAIA balance (${walletInfo.nativeBalance}) - add 0.01 KAIA for operations`);
            } else {
                recommendations.push("✅ Ready for KiloLend (lending) & DragonSwap (DEX) operations");
            }

            // Protocol opportunities with brief descriptions
            if (kilolendTokens.length > 0) {
                recommendations.push(`🏦 Supply ${kilolendTokens.slice(0, 2).join(', ')}${kilolendTokens.length > 2 ? '...' : ''} to KiloLend (lending protocol) for interest`);
            }

            if (dragonswapTokens.length > 1) {
                recommendations.push(`🐉 Swap ${dragonswapTokens.slice(0, 2).join(' ↔ ')}${dragonswapTokens.length > 2 ? '...' : ''} on DragonSwap (DEX)`);
            }

            // Key token opportunities
            if (userTokens.includes('USDT')) {
                recommendations.push("💡 Supply USDT for stable interest on KiloLend (lending)");
            }

            const wkaiaToken = walletInfo.tokens.find((t: any) => t.symbol === 'WKAIA');
            if (wkaiaToken && parseFloat(wkaiaToken.balance) > 0) {
                recommendations.push("🔄 Use WKAIA for DragonSwap (DEX) trades or supply to KiloLend (lending)");
            }

            return {
                status: "success",
                message: "✅ Wallet information retrieved",
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
                    top_tokens: tokenBalances.slice(0, 5)
                },
                recommendations
            };
        } catch (error: any) {
            throw new Error(`Failed to get wallet info: ${error.message}`);
        }
    }
};
