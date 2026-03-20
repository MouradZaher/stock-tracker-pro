import express from 'express';
import cors from 'cors';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ollama from 'ollama';
import { portfolioTools, executePortfolioTool } from './portfolio-tools.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Global array to store our MCP clients and their tools
const mcpClients = [];

async function connectToMCPServer(command, args) {
  try {
    const transport = new StdioClientTransport({
      command,
      args
    });

    const client = new Client(
      {
        name: `client-${args.join('-')}`,
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    await client.connect(transport);
    
    // Fetch available tools from this server
    const toolsResult = await client.listTools();
    
    mcpClients.push({
      client,
      tools: toolsResult.tools || []
    });

    console.log(`Connected to MCP Server: ${args.join(' ')} with ${toolsResult.tools?.length || 0} tools.`);
  } catch (err) {
    console.error(`Failed to connect to ${args.join(' ')}:`, err.message);
  }
}

// Convert MCP Tools format to Ollama Tools format
function getOllamaTools() {
  const ollamaTools = [...portfolioTools]; // Start with local tools
  
  for (const { tools } of mcpClients) {
    for (const tool of tools) {
      ollamaTools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      });
    }
  }
  
  return ollamaTools;
}

// Map tool call to the correct MCP client or local execution
async function callToolRouter(toolName, args) {
  // Check local portfolio tools first
  if (toolName === "get_portfolio" || toolName === "execute_trade") {
    console.log(`Executing LOCAL tool: ${toolName}`);
    return await executePortfolioTool(toolName, args);
  }

  // Fallback to MCP tools
  for (const { client, tools } of mcpClients) {
    if (tools.find(t => t.name === toolName)) {
      console.log(`Executing tool: ${toolName}`);
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      // Extract text from the MCP result format
      return result.content.map(c => c.text).join('\n');
    }
  }
  return `Error: Tool ${toolName} not found.`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const tools = getOllamaTools();

    console.log("Sending request to Ollama...");
    // We use llama3.1 by default. User must have it pulled (`ollama pull llama3.1`)
    const response = await ollama.chat({
      model: 'llama3.1',
      messages,
      tools: tools.length > 0 ? tools : undefined
    });

    // Handle tool calls if the model decided to use any
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      const toolCallMsgs = [];
      
      for (const toolCall of response.message.tool_calls) {
        const resultText = await callToolRouter(
          toolCall.function.name,
          toolCall.function.arguments
        );
        
        toolCallMsgs.push({
          role: 'tool',
          content: resultText,
          name: toolCall.function.name
        });
      }

      // Send the tool results back to Ollama to get the final natural language answer
      const finalResponse = await ollama.chat({
        model: 'llama3.1',
        messages: [
          ...messages,
          response.message,
          ...toolCallMsgs
        ]
      });

      return res.json({ 
        message: finalResponse.message,
        tools_used: response.message.tool_calls.map(tc => tc.function.name) 
      });
    }

    // If no tools were called, return the initial response
    return res.json({ message: response.message, tools_used: [] });

  } catch (error) {
    console.error("Chat API error:", error);
    // Fallback if Ollama is not installed or model is missing
    if (error.message.includes('connect ECONNREFUSED')) {
       return res.status(503).json({ 
         error: "Ollama is not running. Please install Ollama from ollama.com and run 'ollama run llama3.1'." 
       });
    }
    res.status(500).json({ error: error.message });
  }
});

// Initialize the servers
async function init() {
  console.log("Starting MCP Express Server...");
  // Memory Server
  await connectToMCPServer("npx", ["-y", "@modelcontextprotocol/server-memory"]);
  // Fetch Server
  await connectToMCPServer("npx", ["-y", "@modelcontextprotocol/server-fetch"]);
  // Optional: add brave search if needed later.

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Available Tools: ${getOllamaTools().map(t => t.function.name).join(', ')}`);
  });
}

init();
