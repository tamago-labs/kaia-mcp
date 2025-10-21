#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { WalletAgent } from './agent/wallet';
import { validateEnvironment, agentMode, account } from './config';
import { KaiaWalletTools, KaiaReadOnlyTools } from './mcp';

// Validate environment configuration
validateEnvironment();

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

// Create wallet agent instance
const walletAgent = new WalletAgent();

// List available tools based on agent mode
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools;
  
  const toolList: Tool[] = Object.values(tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: "object",
      properties: tool.schema,
      required: Object.keys(tool.schema).filter(key => !tool.schema[key].optional)
    },
  }));

  return {
    tools: toolList,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Get the appropriate tool set based on agent mode
    const tools = agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools;
    const tool = tools[name as keyof typeof tools];

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute the tool
    const result = await tool.handler(walletAgent, args || {});

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
  console.error(`📍 Available tools: ${Object.keys(agentMode === 'transaction' ? KaiaWalletTools : KaiaReadOnlyTools).length}`);
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
