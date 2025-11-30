import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { networkInfo } from "../../config";
import { SYMBOL_TO_CTOKEN } from "../../contracts/ctoken";

export const EnterMarketTool: McpTool = {
    name: "kilolend_enter_market",
    description: "Enter KiloLend markets to enable collateral usage",
    schema: {
        token_symbols: z.array(z.string())
            .describe("Array of token symbols to enter markets for (e.g., ['KAIA', 'USDT', 'BORA'])"),
        check_membership: z.boolean()
            .optional()
            .default(true)
            .describe("Check current market membership before entering (default: true)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            if (!agent.isTransactionMode()) {
                throw new Error('Transaction mode required. Configure private key in environment to enable transactions.');
            }

            const tokenSymbols = input.token_symbols.map((sym: string) => sym.toUpperCase());
            const checkMembership = input.check_membership !== false;

            // Get cToken addresses for all tokens
            const cTokenAddresses: string[] = [];
            const membershipStatus: any[] = [];

            for (const tokenSymbol of tokenSymbols) {
                const cTokenAddress = SYMBOL_TO_CTOKEN[tokenSymbol as keyof typeof SYMBOL_TO_CTOKEN];
                if (!cTokenAddress) {
                    throw new Error(`Market ${tokenSymbol} not available`);
                }

                // Check current membership if requested
                if (checkMembership) {
                    const isMember = await agent.checkMarketMembership(cTokenAddress as `0x${string}`);
                    membershipStatus.push({
                        token_symbol: tokenSymbol,
                        ctoken_address: cTokenAddress,
                        is_member: isMember
                    });

                    // Only add to list if not already a member
                    if (!isMember) {
                        cTokenAddresses.push(cTokenAddress);
                    }
                } else {
                    cTokenAddresses.push(cTokenAddress);
                }
            }

            if (cTokenAddresses.length === 0) {
                return {
                    status: "success",
                    message: "✅ All markets already entered",
                    details: {
                        membership_status: membershipStatus,
                        network: "kaia"
                    }
                };
            }

            const txHash = await agent.enterMarkets(cTokenAddresses as `0x${string}`[]);

            return {
                status: "success",
                message: `✅ Successfully entered ${cTokenAddresses.length} markets`,
                transaction_hash: txHash,
                details: {
                    markets_entered: cTokenAddresses.map((addr, i) => ({
                        token_symbol: tokenSymbols[i],
                        ctoken_address: addr
                    })),
                    membership_status: membershipStatus,
                    network: "kaia",
                    explorer_url: `${networkInfo.blockExplorer}/tx/${txHash}`
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to enter markets: ${error.message}`);
        }
    }
};
