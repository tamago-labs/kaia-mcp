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

        // Create and start MCP server
        const server = createKaiaMcpServer(walletAgent);
        const transport = new StdioServerTransport();
        await server.connect(transport);

        const totalTools = Object.keys(agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools).length
        console.error(`✅ KAIA MCP Server running with ${totalTools} tools`);

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
