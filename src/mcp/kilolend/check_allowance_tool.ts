import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { SYMBOL_TO_CTOKEN } from "../../contracts/ctoken";

export const CheckAllowanceTool: McpTool = {
    name: "kilolend_check_allowance",
    description: "Check token allowance for KiloLend operations",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to check allowance for (e.g., KAIA, USDT, BORA, SIX, MBX, STAKED_KAIA)"),
        spender_address: z.string()
            .optional()
            .describe("Spender address to check allowance for (optional, defaults to cToken address)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const tokenSymbol = input.token_symbol.toUpperCase();
            
            // Default to cToken address if no spender specified
            let spenderAddress = input.spender_address;
            if (!spenderAddress) {
                const cTokenAddress = SYMBOL_TO_CTOKEN[tokenSymbol as keyof typeof SYMBOL_TO_CTOKEN];
                if (!cTokenAddress) {
                    throw new Error(`Market ${tokenSymbol} not available`);
                }
                spenderAddress = cTokenAddress;
            }

            const allowance = await agent.checkAllowance(tokenSymbol, spenderAddress as `0x${string}`);

            return {
                status: "success",
                message: `✅ Allowance checked successfully`,
                details: {
                    token_symbol: tokenSymbol,
                    spender_address: spenderAddress,
                    allowance,
                    allowance_formatted: (Number(allowance) / 1e18).toString(),
                    network: "kaia"
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to check allowance: ${error.message}`);
        }
    }
};
