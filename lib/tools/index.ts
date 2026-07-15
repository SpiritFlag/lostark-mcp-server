// 툴 1개 = 파일 1개. route.ts는 registerTools만 호출 (얇은 라우트)
import type { createMcpHandler } from 'mcp-handler'
import { registerArmories } from './armories'
import { registerSearchMarketItems } from './market'
import { registerPing } from './ping'
import { registerGetSiblings } from './siblings'

/** mcp-handler가 넘겨주는 McpServer 타입 (전이 의존성 직접 import 회피) */
export type ToolServer = Parameters<Parameters<typeof createMcpHandler>[0]>[0]

export function registerTools(server: ToolServer) {
  registerPing(server)
  registerGetSiblings(server)
  registerArmories(server)
  registerSearchMarketItems(server)
}

/** 툴 응답 공통 헬퍼 — 모든 응답은 JSON text content */
export function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

/** 에러 응답 — 사용자가 대화에서 읽을 한국어 메시지 */
export function jsonError(message: string, details?: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: { message, details } }, null, 2) }],
    isError: true,
  }
}
