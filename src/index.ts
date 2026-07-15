#!/usr/bin/env node
import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

function isValidToken(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function main(): void {
  const config = loadConfig();
  const app = express();
  app.use(express.json());

  // claude.ai 웹 커넥터는 커스텀 헤더를 지원하지 않으므로 URL 경로의 토큰으로 인증한다.
  app.post("/mcp/:token", async (req, res) => {
    if (!isValidToken(req.params.token, config.authToken)) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Not Found" },
        id: null,
      });
      return;
    }
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP 요청 처리 실패:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.listen(config.port, () => {
    console.error(`lostark-mcp-server가 포트 ${config.port}에서 실행 중입니다.`);
  });
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
