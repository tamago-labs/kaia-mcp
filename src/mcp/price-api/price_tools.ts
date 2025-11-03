import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { 
    getAllPrices, 
    getTokenPrices, 
    getKaiaEcosystemPrices, 
    getMajorCryptoPrices 
} from "../../tools/price-api/price";

export const GetAllPricesTool: McpTool = {
    name: "get_all_prices",
    description: "Get all available prices from the KiloLend price API including KAIA ecosystem tokens and major cryptocurrencies",
    schema: {},
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        const result = await getAllPrices();

        if (!result.success) {
            return {
                status: "error",
                message: (result as any).error
            };
        }

        return {
            status: "success",
            prices: result.prices,
            count: result.count,
            timestamp: new Date().toISOString()
        };
    },
};

export const GetTokenPricesTool: McpTool = {
    name: "get_token_prices",
    description: "Get prices for specific token symbols (e.g., 'KAIA', 'BTC', 'ETH', 'BORA')",
    schema: {
        symbols: z.array(z.string()).describe("Array of token symbols to get prices for (e.g., ['KAIA', 'BTC', 'ETH'])")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        const result = await getTokenPrices(input.symbols);

        if (!result.success) {
            return {
                status: "error",
                message: (result as any).error
            };
        }

        const successResult = result as any;
        return {
            status: "success",
            prices: successResult.prices,
            count: successResult.count,
            requestedSymbols: successResult.requestedSymbols,
            foundSymbols: successResult.foundSymbols,
            missingSymbols: successResult.requestedSymbols.filter((sym: string) => !successResult.foundSymbols.includes(sym)),
            timestamp: new Date().toISOString()
        };
    },
};

export const GetKaiaEcosystemPricesTool: McpTool = {
    name: "get_kaia_ecosystem_prices",
    description: "Get prices for KAIA ecosystem tokens only (KAIA, BORA, MBX, SIX, SOMNIA, stKAIA)",
    schema: {},
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        const result = await getKaiaEcosystemPrices();

        if (!result.success) {
            return {
                status: "error",
                message: (result as any).error
            };
        }

        const successResult = result as any;
        return {
            status: "success",
            prices: successResult.prices,
            count: successResult.count,
            category: successResult.category,
            timestamp: new Date().toISOString()
        };
    },
};

export const GetMajorCryptoPricesTool: McpTool = {
    name: "get_major_crypto_prices",
    description: "Get prices for major cryptocurrencies (BTC, ETH)",
    schema: {},
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        const result = await getMajorCryptoPrices();

        if (!result.success) {
            return {
                status: "error",
                message: (result as any).error
            };
        }

        const successResult = result as any;
        return {
            status: "success",
            prices: successResult.prices,
            count: successResult.count,
            category: successResult.category,
            timestamp: new Date().toISOString()
        };
    },
};

// Convenience tool for quick price checks
export const GetQuickPricesTool: McpTool = {
    name: "get_quick_prices",
    description: "Get quick price overview of KAIA, BTC, and ETH",
    schema: {},
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        const result = await getTokenPrices(['KAIA', 'BTC', 'ETH']);

        if (!result.success) {
            return {
                status: "error",
                message: (result as any).error
            };
        }

        return {
            status: "success",
            prices: result.prices,
            count: result.count,
            summary: "Quick price overview of KAIA, BTC, and ETH",
            timestamp: new Date().toISOString()
        };
    },
};
