import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createServer(): McpServer {
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

  return server;
}
