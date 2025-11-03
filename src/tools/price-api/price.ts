import axios from 'axios';

const PRICE_API_URL = 'https://kvxdikvk5b.execute-api.ap-southeast-1.amazonaws.com/prod/prices';

// Token symbol mapping for better user experience
const TOKEN_SYMBOL_MAP: Record<string, string> = {
    // API symbol -> Standard symbol
    'STAKED_KAIA': 'stKAIA',        // Lair Staked KAIA
    'MARBLEX': 'MBX',               // MARBLEX token
    'SOMNIA': 'SOMNIA',            // Keep as is
    'KAIA': 'KAIA',                 // Keep as is
    'BORA': 'BORA',                 // Keep as is
    'SIX': 'SIX',                   // Keep as is
    'BTC': 'BTC',                   // Keep as is
    'ETH': 'ETH',                   // Keep as is
};

// Reverse mapping for API requests
const REVERSE_TOKEN_MAP: Record<string, string> = {};
Object.entries(TOKEN_SYMBOL_MAP).forEach(([apiSymbol, standardSymbol]) => {
    REVERSE_TOKEN_MAP[standardSymbol] = apiSymbol;
});

// Map API response to standard symbols
function mapApiResponse(prices: any[]): any[] {
    return prices.map(item => ({
        ...item,
        symbol: TOKEN_SYMBOL_MAP[item.symbol] || item.symbol
    }));
}

// Filter prices by standard symbols and map back to API symbols for requests
function mapSymbolsForApi(symbols: string[]): string[] {
    return symbols.map(symbol => REVERSE_TOKEN_MAP[symbol] || symbol);
}

/**
 * Get all available prices from the KiloLend price API
 * @returns All price data with success status
 */
export const getAllPrices = async () => {
    try {
        const response = await axios.get(PRICE_API_URL);
        
        if (response.data.success) {
            // Map API symbols to standard symbols for better user experience
            const mappedPrices = mapApiResponse(response.data.data);
            return {
                success: true,
                prices: mappedPrices,
                count: response.data.count
            };
        } else {
            return {
                success: false,
                error: 'API returned unsuccessful response'
            };
        }
    } catch (error: any) {
        console.error('Error fetching all prices:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch prices from API'
        };
    }
};

/**
 * Get prices for specific token symbols
 * @param symbols Array of token symbols (e.g., ['KAIA', 'BTC', 'ETH'])
 * @returns Filtered price data for requested symbols
 */
export const getTokenPrices = async (symbols: string[]) => {
    try {
        const allPricesResult = await getAllPrices();
        
        if (!allPricesResult.success) {
            return allPricesResult;
        }

        const filteredPrices = (allPricesResult.prices || []).filter((price: any) => 
            symbols.includes(price.symbol)
        );

        return {
            success: true,
            prices: filteredPrices,
            count: filteredPrices.length,
            requestedSymbols: symbols,
            foundSymbols: filteredPrices.map((price: any) => price.symbol)
        };
    } catch (error: any) {
        console.error('Error fetching token prices:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch token prices'
        };
    }
};

/**
 * Get prices for KAIA ecosystem tokens only
 * @returns KAIA ecosystem price data
 */
export const getKaiaEcosystemPrices = async () => {
    try {
        const allPricesResult = await getAllPrices();
        
        if (!allPricesResult.success) {
            return allPricesResult;
        }

        // KAIA ecosystem tokens (using standard symbols)
        const kaiaEcosystemSymbols = ['KAIA', 'BORA', 'MBX', 'SIX', 'SOMNIA', 'stKAIA'];
        
        const ecosystemPrices = (allPricesResult.prices || []).filter((price: any) => 
            kaiaEcosystemSymbols.includes(price.symbol)
        );

        return {
            success: true,
            prices: ecosystemPrices,
            count: ecosystemPrices.length,
            category: 'kaia_ecosystem'
        };
    } catch (error: any) {
        console.error('Error fetching KAIA ecosystem prices:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch KAIA ecosystem prices'
        };
    }
};

/**
 * Get major cryptocurrency prices (BTC, ETH, etc.)
 * @returns Major crypto price data
 */
export const getMajorCryptoPrices = async () => {
    try {
        const allPricesResult = await getAllPrices();
        
        if (!allPricesResult.success) {
            return allPricesResult;
        }

        // Major cryptocurrencies
        const majorCryptoSymbols = ['BTC', 'ETH'];
        
        const cryptoPrices = (allPricesResult.prices || []).filter((price: any) => 
            majorCryptoSymbols.includes(price.symbol)
        );

        return {
            success: true,
            prices: cryptoPrices,
            count: cryptoPrices.length,
            category: 'major_crypto'
        };
    } catch (error: any) {
        console.error('Error fetching major crypto prices:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch major crypto prices'
        };
    }
};
