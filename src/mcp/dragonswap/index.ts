import { GetSwapQuoteTool } from "./get_swap_quote_tool";
import { ExecuteSwapTool } from "./execute_swap_tool";
import { GetPoolInfoTool } from "./get_pool_info_tool";
import { GetRouteTool } from "./get_route_tool";
import { type McpTool } from "../../types";

// DragonSwap Tools - All DragonSwap DEX operations
export const DragonSwapTools: Record<string, McpTool> = {
    // Quote and routing operations (read-only)
    "dragonswap_get_quote": GetSwapQuoteTool,        // Get swap quotes without executing
    "dragonswap_get_pool_info": GetPoolInfoTool,      // Get pool information and liquidity data
    "dragonswap_get_route": GetRouteTool,             // Get best routing path (supports multi-hop)
    
    // Transaction operations (require private key)
    "dragonswap_execute_swap": ExecuteSwapTool,       // Execute token swaps
};

// DragonSwap Read-Only Tools - Operations that don't require private key
export const DragonSwapReadOnlyTools: Record<string, McpTool> = {
    "dragonswap_get_quote": GetSwapQuoteTool,          // Get swap quotes (read-only)
    "dragonswap_get_pool_info": GetPoolInfoTool,       // Get pool information (read-only)
    "dragonswap_get_route": GetRouteTool,              // Get routing information (read-only)
};

// Export individual tools for direct access
export {
    GetSwapQuoteTool,
    ExecuteSwapTool,
    GetPoolInfoTool,
    GetRouteTool
};

// Tool categories for better organization
export const DragonSwapToolCategories = {
    QUOTE: ["dragonswap_get_quote", "dragonswap_get_route"],
    POOL_INFO: ["dragonswap_get_pool_info"],
    TRADING: ["dragonswap_execute_swap"],
    READ_ONLY: ["dragonswap_get_quote", "dragonswap_get_pool_info", "dragonswap_get_route"],
    TRANSACTION: ["dragonswap_execute_swap"]
} as const;

// Helper function to get tools by category
export function getDragonSwapToolsByCategory(category: keyof typeof DragonSwapToolCategories): McpTool[] {
    const toolNames = DragonSwapToolCategories[category];
    return toolNames.map(name => DragonSwapTools[name]).filter(Boolean);
}

// Helper function to check if tool requires transaction mode
export function requiresTransactionMode(toolName: string): boolean {
    return DragonSwapToolCategories.TRANSACTION.includes(toolName as any);
}

// Helper function to get tool descriptions
export function getDragonSwapToolDescriptions(): Record<string, string> {
    return Object.entries(DragonSwapTools).reduce((acc, [name, tool]) => {
        acc[name] = tool.description;
        return acc;
    }, {} as Record<string, string>);
}

// Default export for convenience
export default DragonSwapTools;
