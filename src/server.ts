#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { toolsHandler } from './handlers/tools.js';
import { resourcesHandler } from './handlers/resources.js';
import { promptsHandler } from './handlers/prompts.js';

// Server information
const SERVER_INFO = {
  name: 'tdd-mcp-server',
  version: '1.0.0',
  description: 'Test Driven Development MCP Server',
  author: 'TDD MCP Team',
  license: 'MIT',
};

// Create server instance
const server = new Server(SERVER_INFO, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
});

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, toolsHandler.listTools);
server.setRequestHandler(CallToolRequestSchema, toolsHandler.callTool);

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, resourcesHandler.listResources);
server.setRequestHandler(ReadResourceRequestSchema, resourcesHandler.readResource);

// Prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, promptsHandler.listPrompts);
server.setRequestHandler(GetPromptRequestSchema, promptsHandler.getPrompt);

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

// Main function
async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('TDD MCP Server started successfully');
    console.error(`Version: ${SERVER_INFO.version}`);
    console.error('Waiting for MCP client connections...');
  } catch (error) {
    console.error('Failed to start TDD MCP Server:', error);
    process.exit(1);
  }
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server startup error:', error);
    process.exit(1);
  });
}

export { server, SERVER_INFO };