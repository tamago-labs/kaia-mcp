import { GetSwapQuoteTool, handleGetSwapQuote } from "./get_swap_quote_tool";
import { ExecuteSwapTool, handleExecuteSwap } from "./execute_swap_tool";
import { GetPoolInfoTool, handleGetPoolInfo } from "./get_pool_info_tool";
import { dragonSwapRouter, createDragonSwapRouter, IDragonSwapRouter } from "../../dragonswap/router";

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

// Tool handlers (will be initialized with router)
export const DragonSwapToolHandlers: any = {};

// Export the router for direct access
export { dragonSwapRouter, createDragonSwapRouter, IDragonSwapRouter };

// Function to initialize tool handlers with router instance
export function initializeDragonSwapTools(router: IDragonSwapRouter) {
  DragonSwapToolHandlers["get_dragonswap_quote"] = (args: any) => handleGetSwapQuote(args, router);
  DragonSwapToolHandlers["execute_dragonswap_swap"] = (args: any) => handleExecuteSwap(args, router);
  DragonSwapToolHandlers["get_dragonswap_pool_info"] = (args: any) => handleGetPoolInfo(args, router);
}
