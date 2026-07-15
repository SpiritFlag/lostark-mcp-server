#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  loadConfig();

  const server = new McpServer({
    name: "lostark-mcp-server",
    version: "0.1.0",
  });

  server.registerTool(
    "ping",
    {
      description: "서버 동작 확인용 툴. 항상 'pong'을 반환합니다.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: "pong" }],
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("lostark-mcp-server가 stdio에서 실행 중입니다.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
