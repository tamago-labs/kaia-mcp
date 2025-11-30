import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetMarketsTool: McpTool = {
    name: "kilolend_get_lending_markets",
    description: "Get all lending markets KiloLend with their current rates and statistics",
    schema: {},
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Use the getAllMarkets method which already fetches all market data
            const markets = await agent.getAllMarkets();

            return {
                status: "success",
                message: `✅ Retrieved ${markets.length} lending markets`,
                network: "kaia",
                markets: markets,
                summary: {
                    total_markets: markets.length,
                    avg_supply_apy: (markets.reduce((sum, m) => sum + parseFloat(m.supplyApy), 0) / markets.length).toFixed(2),
                    avg_borrow_apy: (markets.reduce((sum, m) => sum + parseFloat(m.borrowApy), 0) / markets.length).toFixed(2),
                    highest_supply_apy: markets.reduce((max, m) => parseFloat(m.supplyApy) > parseFloat(max.supplyApy) ? m : max, markets[0])?.symbol || 'N/A',
                    highest_borrow_apy: markets.reduce((max, m) => parseFloat(m.borrowApy) > parseFloat(max.borrowApy) ? m : max, markets[0])?.symbol || 'N/A'
                },
                recommendations: [
                    "Compare supply and borrow rates across markets",
                    "Check utilization rates - high utilization may indicate increasing rates",
                    "Consider market depth (total supply) for larger positions",
                    "Monitor rates regularly as they change with market conditions"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to get markets: ${error.message}`);
        }
    }
};
