// 얇은 라우트: 시크릿 검증 + 툴 등록만 (Moneybook 패턴).
// 시크릿 불일치 시 404 — 401보다 엔드포인트 존재 은폐에 유리.
import { timingSafeEqual } from 'node:crypto'
import { createMcpHandler } from 'mcp-handler'
import { registerTools } from '@/lib/tools'

const handler = createMcpHandler(
  (server) => registerTools(server),
  {},
  { basePath: `/api/mcp/${process.env.AUTH_TOKEN}` }
)

function secretMatches(candidate: string): boolean {
  const expected = process.env.AUTH_TOKEN
  if (!expected) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function guarded(
  req: Request,
  ctx: { params: Promise<{ secret: string; transport: string }> }
) {
  const { secret, transport } = await ctx.params
  // Streamable HTTP('mcp')만 지원 — SSE는 Redis 필요라 미지원
  if (transport !== 'mcp' || !secretMatches(secret)) {
    return new Response(null, { status: 404 })
  }
  return handler(req)
}

export { guarded as GET, guarded as POST, guarded as DELETE }
