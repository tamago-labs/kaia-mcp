import { GetWalletInfoTool } from "./wallet/get_wallet_info_tool";
import { SendNativeTokenTool } from "./wallet/send_native_token_tool";
import { SendERC20TokenTool } from "./wallet/send_erc20_token_tool";
import { WrapKaiaTool } from "./wallet/wrap_kaia_tool";
import { UnwrapKaiaTool } from "./wallet/unwrap_kaia_tool";
import { 
    GetAccountLiquidityTool, 
    GetMarketsTool, 
    GetProtocolStatsTool, 
    SupplyToMarketTool, 
    BorrowFromMarketTool, 
    RepayBorrowTool,
    CheckAllowanceTool,
    ApproveTokenTool,
    EnterMarketTool
} from "./kilolend";
import { 
    DragonSwapTools, 
    DragonSwapReadOnlyTools 
} from "./dragonswap";

export const KaiaWalletTools = {
    // Basic wallet information and account management
    "GetWalletInfoTool": GetWalletInfoTool,                    // Get wallet address, balance, network info
    "GetAccountLiquidityTool": GetAccountLiquidityTool,        // Check account health factor and positions
    "GetMarketsTool": GetMarketsTool,                          // Get all lending markets with rates
    "GetProtocolStatsTool": GetProtocolStatsTool,              // Get overall protocol statistics

    // Transaction operations (require private key)
    "SendNativeTokenTool": SendNativeTokenTool,                // Send native KAIA tokens
    "SendERC20TokenTool": SendERC20TokenTool,                  // Send ERC-20 tokens
    "WrapKaiaTool": WrapKaiaTool,                              // Wrap KAIA to WKAIA
    "UnwrapKaiaTool": UnwrapKaiaTool,                          // Unwrap WKAIA to KAIA
    "CheckAllowanceTool": CheckAllowanceTool,                  // Check token allowance for operations
    "ApproveTokenTool": ApproveTokenTool,                      // Approve tokens for KiloLend operations
    "EnterMarketTool": EnterMarketTool,                        // Enter markets to enable collateral usage
    "SupplyToMarketTool": SupplyToMarketTool,                  // Supply tokens to lending markets
    "BorrowFromMarketTool": BorrowFromMarketTool,              // Borrow tokens from markets
    "RepayBorrowTool": RepayBorrowTool,                        // Repay borrowed tokens

    // DragonSwap DEX operations
    ...DragonSwapTools,                                        // All DragonSwap tools (quotes, swaps, pool info, routing)
};

export const KaiaReadOnlyTools = {
    // Read-only operations
    "GetWalletInfoTool": GetWalletInfoTool,
    "GetAccountLiquidityTool": GetAccountLiquidityTool,
    "GetMarketsTool": GetMarketsTool,
    "GetProtocolStatsTool": GetProtocolStatsTool,
    

    // DragonSwap read-only operations
    ...DragonSwapReadOnlyTools,                                // DragonSwap quotes, pool info, routing (no private key)
};
