import { GetWalletInfoTool } from "./wallet/get_wallet_info_tool";
import { GetAccountLiquidityTool } from "./wallet/get_account_liquidity_tool";
import { GetMarketsTool } from "./wallet/get_markets_tool";
import { GetProtocolStatsTool } from "./wallet/get_protocol_stats_tool";
import { SendNativeTokenTool } from "./wallet/send_native_token_tool";
import { SendERC20TokenTool } from "./wallet/send_erc20_token_tool";
import { SupplyToMarketTool } from "./wallet/supply_to_market_tool";
import { BorrowFromMarketTool } from "./wallet/borrow_from_market_tool";
import { RepayBorrowTool } from "./wallet/repay_borrow_tool";

export const KaiaWalletTools = {
    // Basic wallet information and account management
    "GetWalletInfoTool": GetWalletInfoTool,                    // Get wallet address, balance, network info
    "GetAccountLiquidityTool": GetAccountLiquidityTool,        // Check account health factor and positions
    "GetMarketsTool": GetMarketsTool,                          // Get all lending markets with rates
    "GetProtocolStatsTool": GetProtocolStatsTool,              // Get overall protocol statistics

    // Transaction operations (require private key)
    "SendNativeTokenTool": SendNativeTokenTool,                // Send native KAIA tokens
    "SendERC20TokenTool": SendERC20TokenTool,                  // Send ERC-20 tokens
    "SupplyToMarketTool": SupplyToMarketTool,                  // Supply tokens to lending markets
    "BorrowFromMarketTool": BorrowFromMarketTool,              // Borrow tokens from markets
    "RepayBorrowTool": RepayBorrowTool,                        // Repay borrowed tokens
};

export const KaiaReadOnlyTools = {
    // Read-only operations (no private key required)
    "GetWalletInfoTool": GetWalletInfoTool,
    "GetAccountLiquidityTool": GetAccountLiquidityTool,
    "GetMarketsTool": GetMarketsTool,
    "GetProtocolStatsTool": GetProtocolStatsTool,
};
