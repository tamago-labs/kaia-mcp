import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetKiloPointsTool: McpTool = {
    name: "kilolend_get_kilo_points",
    description: "Get user KILO points balance",
    schema: {
        account_address: z.string()
            .optional()
            .describe("Account address to check (optional, defaults to current wallet)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            // Get the account address - use provided address or get from wallet
            let accountAddress = input.account_address;
            if (!accountAddress) {
                const walletAddress = agent.getAddress();
                if (!walletAddress) {
                    return {
                        error: 'No wallet connected',
                        message: 'Please connect your wallet to view KILO points',
                        suggestion: 'Connect your wallet and try again'
                    };
                }
                accountAddress = walletAddress;
            }

            // Use the same API endpoint as the KiloModal
            const response = await fetch(
                `https://kvxdikvk5b.execute-api.ap-southeast-1.amazonaws.com/prod/users/${accountAddress}`
            );
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                return {
                    status: "success",
                    message: "✅ KILO points retrieved - New user",
                    account_address: accountAddress,
                    userPoints: 0,
                    isNewUser: true
                };
            }
            
            // Process the daily points data to calculate total
            let totalPoints = 0;
            
            if (data.dailyPoints && Array.isArray(data.dailyPoints)) {
                data.dailyPoints.forEach((entry: any) => {
                    const points = entry[entry.date] || 0;
                    totalPoints += points;
                });
            }
            
            const result = {
                status: "success",
                message: "✅ KILO points retrieved",
                account_address: accountAddress,
                userPoints: totalPoints,
                isNewUser: false
            };
             
            
            return result;
            
        } catch (error: any) {
            console.error('Error fetching KILO points:', error);
            return {
                status: "error",
                message: "❌ Failed to fetch KILO points",
                error: error.message,
                userPoints: 0
            };
        }
    }
};
