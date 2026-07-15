import { z } from 'zod'
import { getClient, LostArkApiError } from '../lostark/client'
import { jsonError, jsonResult, type ToolServer } from './index'

export function registerGetSiblings(server: ToolServer) {
  server.tool(
    'get_siblings',
    '캐릭터가 속한 원정대의 전체 캐릭터 목록을 조회한다. 서버명, 캐릭터명, 클래스, 전투 레벨, 아이템 레벨을 반환.',
    { character_name: z.string().min(1).describe('조회할 캐릭터명 (원정대 내 아무 캐릭터나 가능)') },
    async ({ character_name }) => {
      try {
        const data = await getClient().get(`/characters/${encodeURIComponent(character_name)}/siblings`)
        // 존재하지 않는 캐릭터는 200 + 빈 배열로 응답한다
        if (data == null || (Array.isArray(data) && data.length === 0))
          return jsonError(`캐릭터 "${character_name}"을(를) 찾을 수 없어요`)
        return jsonResult(data)
      } catch (err) {
        if (err instanceof LostArkApiError) return jsonError(err.message)
        return jsonError('원정대 조회에 실패했어요', { cause: String(err) })
      }
    }
  )
}
