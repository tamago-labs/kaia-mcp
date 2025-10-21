import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetProtocolStatsTool: McpTool = {
    name: "kaia_get_lending_stats",
    description: "Get overall protocol statistics and TVL information",
    schema: {
        private_key: z.string()
            .optional()
            .describe("Private key for wallet access (optional, only needed for enhanced features)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Create a new WalletAgent with private key if provided
            const walletAgent = input.private_key ? new WalletAgent(input.private_key) : agent;
            
            // Use the getAllMarkets method to get market data
            const markets = await walletAgent.getAllMarkets();
            
            let totalSupplyUSD = 0;
            let totalBorrowsUSD = 0;
            let totalCashUSD = 0;
            const marketStats = [];

            // Mock prices for calculation (in a real implementation, you'd fetch from price oracle)
            const mockPrices: Record<string, number> = {
                'USDT': 1.0,
                'SIX': 0.05,
                'BORA': 0.15,
                'MBX': 0.08,
                'KAIA': 0.25,
                'stKAIA': 0.26
            };

            for (const market of markets) {
                try {
                    const price = mockPrices[market.underlyingSymbol] || 0;
                    
                    const totalSupply = parseFloat(market.totalSupply);
                    const totalBorrows = parseFloat(market.totalBorrows);
                    const cash = parseFloat(market.cash);
                    
                    const supplyValueUSD = totalSupply * price;
                    const borrowValueUSD = totalBorrows * price;
                    const cashValueUSD = cash * price;
                    
                    totalSupplyUSD += supplyValueUSD;
                    totalBorrowsUSD += borrowValueUSD;
                    totalCashUSD += cashValueUSD;
                    
                    marketStats.push({
                        symbol: market.symbol,
                        underlying: market.underlyingSymbol,
                        price_usd: price,
                        total_supply: totalSupply.toFixed(6),
                        total_borrows: totalBorrows.toFixed(6),
                        supply_value_usd: supplyValueUSD.toFixed(2),
                        borrow_value_usd: borrowValueUSD.toFixed(2),
                        cash_value_usd: cashValueUSD.toFixed(2)
                    });
                } catch (error) {
                    console.warn(`Failed to process data for ${market.symbol}:`, error);
                }
            }

            const utilization = totalSupplyUSD > 0 ? (totalBorrowsUSD / totalSupplyUSD) * 100 : 0;
            const protocolHealth = utilization < 80 ? 'Healthy' : utilization < 90 ? 'Moderate Risk' : 'High Risk';

            return {
                status: "success",
                message: "✅ Protocol statistics retrieved successfully",
                network: "kaia",
                protocol_stats: {
                    total_value_locked_usd: totalSupplyUSD.toFixed(2),
                    total_borrows_usd: totalBorrowsUSD.toFixed(2),
                    total_cash_usd: totalCashUSD.toFixed(2),
                    utilization_rate: utilization.toFixed(2),
                    protocol_health: protocolHealth,
                    active_markets: marketStats.length,
                    available_liquidity_usd: (totalCashUSD - totalBorrowsUSD).toFixed(2)
                },
                market_breakdown: marketStats,
                insights: {
                    highest_tvl_market: marketStats.reduce((max, m) => parseFloat(m.supply_value_usd) > parseFloat(max.supply_value_usd) ? m : max, marketStats[0])?.symbol || 'N/A',
                    most_borrowed_market: marketStats.reduce((max, m) => parseFloat(m.borrow_value_usd) > parseFloat(max.borrow_value_usd) ? m : max, marketStats[0])?.symbol || 'N/A',
                    liquidity_distribution: marketStats.map(m => ({
                        market: m.symbol,
                        percentage: totalSupplyUSD > 0 ? ((parseFloat(m.supply_value_usd) / totalSupplyUSD) * 100).toFixed(2) : "0.00"
                    }))
                },
                recommendations: utilization > 80
                    ? [
                        "⚠️ High utilization rate - borrowing costs may increase",
                        "Consider supplying assets to earn higher rates",
                        "Monitor for potential rate changes"
                    ]
                    : [
                        "✅ Healthy utilization rate",
                        "Good opportunity for both suppliers and borrowers",
                        "Protocol operating efficiently"
                    ]
            };
        } catch (error: any) {
            throw new Error(`Failed to get protocol stats: ${error.message}`);
        }
    }
};
