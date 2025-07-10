import { MCPServer } from './mock-sdk.js';
import { createServer } from 'http';
import express from 'express';
import { courseDetectionTool } from './tools/courseDetection.js';
import { voiceTranscriptionTool } from './tools/voiceTranscription.js';
import { scoreParsingTool } from './tools/scoreParsing.js';
import { bettingEngineTool } from './tools/bettingEngine.js';
import { realtimeUpdateTool } from './tools/realtimeUpdate.js';
import { analyticsCollectorTool } from './tools/analyticsCollector.js';

const app = express();
const httpServer = createServer(app);

const mcpServer = new MCPServer({
  name: 'fairwaylive-mcp',
  version: '1.0.0',
  description: 'MCP server for FairwayLive golf app',
  tools: [
    courseDetectionTool,
    voiceTranscriptionTool,
    scoreParsingTool,
    bettingEngineTool,
    realtimeUpdateTool,
    analyticsCollectorTool
  ]
});

mcpServer.on('tool:execute', async (toolName, params) => {
  console.log(`Executing tool: ${toolName}`, params);
});

const PORT = process.env.MCP_SERVER_PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`FairwayLive MCP Server running on port ${PORT}`);
});

export { mcpServer };