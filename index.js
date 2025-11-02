#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

// Define the search tool input schema
const SearchFileToolSchema = z.object({
  filePath: z.string().describe("Path to the file to search in"),
  keyword: z.string().describe("Keyword to search for in the file"),
  caseSensitive: z.boolean().optional().default(false).describe("Whether the search should be case-sensitive"),
});

class FileSearchServer {
  constructor() {
    this.server = new Server(
      {
        name: "file-search-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_file",
          description: "Search for a keyword in a specified file and return all matching lines with line numbers",
          inputSchema: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "Path to the file to search in",
              },
              keyword: {
                type: "string",
                description: "Keyword to search for in the file",
              },
              caseSensitive: {
                type: "boolean",
                description: "Whether the search should be case-sensitive (default: false)",
                default: false,
              },
            },
            required: ["filePath", "keyword"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "search_file") {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      // Validate and parse arguments
      const args = SearchFileToolSchema.parse(request.params.arguments);
      
      try {
        const results = await this.searchFile(
          args.filePath,
          args.keyword,
          args.caseSensitive
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error.message,
                filePath: args.filePath,
                keyword: args.keyword,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async searchFile(filePath, keyword, caseSensitive = false) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read file content
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");
      
      // Search for keyword
      const matches = [];
      const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
      
      lines.forEach((line, index) => {
        const searchLine = caseSensitive ? line : line.toLowerCase();
        if (searchLine.includes(searchKeyword)) {
          matches.push({
            lineNumber: index + 1,
            content: line,
          });
        }
      });

      return {
        success: true,
        filePath: path.resolve(filePath),
        keyword: keyword,
        caseSensitive: caseSensitive,
        totalMatches: matches.length,
        matches: matches,
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`File not found: ${filePath}`);
      } else if (error.code === "EACCES") {
        throw new Error(`Permission denied: ${filePath}`);
      } else {
        throw new Error(`Error reading file: ${error.message}`);
      }
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("File Search MCP server running on stdio");
  }
}

// Start the server
const server = new FileSearchServer();
server.run().catch(console.error);