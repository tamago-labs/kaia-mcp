import { GetSwapQuoteTool, handleGetSwapQuote } from "./get_swap_quote_tool";
import { ExecuteSwapTool, handleExecuteSwap } from "./execute_swap_tool";
import { GetPoolInfoTool, handleGetPoolInfo } from "./get_pool_info_tool";
import { dragonSwapRouter } from "../../dragonswap/router";

export const DragonSwapTools = {
    // Quote and swap operations
    "GetSwapQuoteTool": GetSwapQuoteTool,                    // Get swap quotes without executing
    "ExecuteSwapTool": ExecuteSwapTool,                      // Execute token swaps (requires private key)
    "GetPoolInfoTool": GetPoolInfoTool,                      // Get pool information and liquidity data
};

export const DragonSwapReadOnlyTools = {
    // Read-only operations (no private key required)
    "GetSwapQuoteTool": GetSwapQuoteTool,
    "GetPoolInfoTool": GetPoolInfoTool,
};

// Tool handlers
export const DragonSwapToolHandlers = {
    "get_dragonswap_quote": handleGetSwapQuote,
    "execute_dragonswap_swap": handleExecuteSwap,
    "get_dragonswap_pool_info": handleGetPoolInfo,
};

// Export the router for direct access
export { dragonSwapRouter };
