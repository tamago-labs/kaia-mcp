import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WalletAgent } from './agent/wallet';
import { validateEnvironment, agentMode, account, getEnvironmentConfig } from './config';
import { KaiaWalletTools, KaiaReadOnlyTools } from './mcp';

// Export WalletAgent for external use
export { WalletAgent };

/**
 * Creates an MCP server for KAIA blockchain operations
 * Provides comprehensive wallet, lending, and DEX functionality
 */

function createKaiaMcpServer(agent: WalletAgent) {

    // Create MCP server instance
    const server = new McpServer({
        name: "kaia-mcp",
        version: "1.0.0"
    });

    // Get the appropriate tool sets based on agent mode
    const kaiaTools = agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools;

    // Combine all tools
    const allTools = { ...kaiaTools };

    // Register all tools
    for (const [toolKey, tool] of Object.entries(allTools)) {
        server.tool(tool.name, tool.description, tool.schema, async (params: any): Promise<any> => {
            try {
                // Execute the handler with the agent and params
                const result = await tool.handler(agent, params);

                // Format the result as MCP tool response
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                console.error(`Tool execution error [${tool.name}]:`, error);
                // Handle errors in MCP format
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: error instanceof Error
                                ? error.message
                                : "Unknown error occurred",
                        },
                    ],
                };
            }
        });
    }

    const toolCount = Object.keys(allTools).length;
    console.error(`✅ Registered ${toolCount} KAIA tools`);
    return server; 
}

async function main() {
    try {
        console.error("🔍 Starting KAIA MCP Server...");

        // Validate environment before proceeding
        validateEnvironment();
        const environment = getEnvironmentConfig();

        // Create wallet agent instance with private key if available
        const privateKey = environment.privateKey;
        const walletAgent = new WalletAgent(privateKey);

        // Initialize DragonSwap router with the same private key
        // const dragonSwapRouter: IDragonSwapRouter = createDragonSwapRouter(privateKey);

        // Initialize DragonSwap tools with the router instance
        // initializeDragonSwapTools(dragonSwapRouter);

        // Create and start MCP server
        const server = createKaiaMcpServer(walletAgent);
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error("✅ KAIA MCP Server is running!");
        console.error(`📍 Mode: ${agentMode}`);
        console.error(`📍 Account: ${account.address}`);

        const totalTools = Object.keys(agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools).length + 0
        // Object.keys(agentMode === 'transaction' ? DragonSwapTools : DragonSwapReadOnlyTools).length;
        console.error(`📍 Available tools: ${totalTools}`);

        console.error("🔧 Available capabilities:");
        if (agentMode === 'transaction') {
            console.error("   • Wallet operations (send, supply, borrow, repay)");
            console.error("   • Transaction capabilities with private key");
        } else {
            console.error("   • Read-only wallet information");
            console.error("   • Market data and analytics");
        }
        console.error("   • Lending market information");
        console.error("   • Account liquidity and health checks");
        console.error("   • Protocol statistics");
        console.error("   • DragonSwap DEX operations");
        console.error("🌐 Network: KAIA (Klaytn)");

    } catch (error) {
        console.error('❌ Error starting KAIA MCP server:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    console.error('\n🛑 Shutting down KAIA MCP Server...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('\n🛑 Shutting down KAIA MCP Server...');
    process.exit(0);
});

// Start the server
main();
