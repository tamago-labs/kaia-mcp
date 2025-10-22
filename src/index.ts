import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { WalletAgent } from './agent/wallet';
import { validateEnvironment, agentMode, account, getEnvironmentConfig } from './config';
import { KaiaWalletTools, KaiaReadOnlyTools } from './mcp';
import { DragonSwapTools, DragonSwapReadOnlyTools, DragonSwapToolHandlers, createDragonSwapRouter, initializeDragonSwapTools, IDragonSwapRouter } from './mcp/dragonswap';

// Validate environment configuration
validateEnvironment();

// Get private key from environment configuration
const getPrivateKey = (): string | undefined => {
    const config = getEnvironmentConfig();
    return config.privateKey;
};

// Create server instance
const server = new Server(
  {
    name: "kaia-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create wallet agent instance with private key if available
const privateKey = getPrivateKey();
const walletAgent = new WalletAgent(privateKey);

// Initialize DragonSwap router with the same private key
const dragonSwapRouter: IDragonSwapRouter = createDragonSwapRouter(privateKey);

// Initialize DragonSwap tools with the router instance
initializeDragonSwapTools(dragonSwapRouter);

// List available tools based on agent mode
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const kaiaTools = agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools;
  const dragonSwapTools = agentMode === 'transaction' ? DragonSwapTools : DragonSwapReadOnlyTools;
  
  // Combine all tools
  const allTools = { ...kaiaTools, ...dragonSwapTools };
  
  const toolList: Tool[] = Object.values(allTools).map((tool) => {
    // Handle both old format (schema) and new format (inputSchema)
    let inputSchema: any;
    
    if ('inputSchema' in tool) {
      inputSchema = tool.inputSchema;
    } else {
      // Convert zod schema to input schema format
      const properties: any = {};
      const required: string[] = [];
      
      Object.entries(tool.schema).forEach(([key, schema]: [string, any]) => {
        properties[key] = {
          type: "string",
          description: schema._def.description || key
        };
        
        if (!schema._def.optional) {
          required.push(key);
        }
      });
      
      inputSchema = {
        type: "object",
        properties,
        required
      };
    }
    
    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
    };
  });

  return {
    tools: toolList,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Get the appropriate tool sets based on agent mode
    const kaiaTools = agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools;
    const dragonSwapTools = agentMode === 'transaction' ? DragonSwapTools : DragonSwapReadOnlyTools;
    
    // Combine all tools
    const allTools = { ...kaiaTools, ...dragonSwapTools };
    const tool = allTools[name as keyof typeof allTools];

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    let result: any;

    // Handle different tool types
    if ('handler' in tool && typeof tool.handler === 'function') {
      // Kaia wallet tools (old format)
      result = await (tool.handler as any)(walletAgent, args || {});
    } else {
      // DragonSwap tools (new format)
      const handler = DragonSwapToolHandlers[name as keyof typeof DragonSwapToolHandlers];
      if (!handler) {
        throw new Error(`No handler found for tool: ${name}`);
      }
      result = await handler(args || {});
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error executing tool ${name}:`, error);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "error",
            message: error.message || "Unknown error occurred",
            tool: name,
            arguments: args
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error(`🚀 KAIA-MCP Server started`);
  console.error(`📍 Mode: ${agentMode}`); 
  console.error(`📍 Account: ${account.address}`);
  const totalTools = Object.keys(agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools).length + 
                    Object.keys(agentMode === 'transaction' ? DragonSwapTools : DragonSwapReadOnlyTools).length;
  console.error(`📍 Available tools: ${totalTools}`);
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.error('\n🛑 Shutting down KAIA-MCP Server...');
  await walletAgent.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 Shutting down KAIA-MCP Server...');
  await walletAgent.disconnect();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Export dragonSwapRouter for external access
export { dragonSwapRouter };
