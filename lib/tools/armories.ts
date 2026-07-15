// 로스트아크 armories API의 섹션별 경로를 그대로 툴로 세분화한다.
import { z } from 'zod'
import { getClient, LostArkApiError } from '../lostark/client'
import { jsonError, jsonResult, type ToolServer } from './index'

const SECTIONS = [
  { path: 'profiles', tool: 'get_character_profile', desc: '캐릭터 기본 프로필 (레벨, 아이템 레벨, 스탯, 성향, 칭호, 길드 등)' },
  { path: 'equipment', tool: 'get_character_equipment', desc: '장착 중인 장비 (무기/방어구/장신구/어빌리티 스톤 등급·이름)' },
  { path: 'engravings', tool: 'get_character_engravings', desc: '활성화된 각인 효과' },
  { path: 'gems', tool: 'get_character_gems', desc: '장착 중인 보석과 보석 효과' },
  { path: 'cards', tool: 'get_character_cards', desc: '장착 중인 카드와 카드 세트 효과' },
  { path: 'combat-skills', tool: 'get_character_combat_skills', desc: '전투 스킬과 트라이포드 구성' },
  { path: 'avatars', tool: 'get_character_avatars', desc: '장착 중인 아바타' },
  { path: 'arkpassive', tool: 'get_character_arkpassive', desc: '아크 패시브 (진화/깨달음/도약) 포인트와 노드' },
  { path: 'collectibles', tool: 'get_character_collectibles', desc: '수집품 진행 현황 (모코코 씨앗, 섬의 마음 등)' },
  { path: 'colosseums', tool: 'get_character_colosseums', desc: '증명의 전장(PVP) 전적' },
] as const

/** Tooltip 필드는 매우 커서(수십 KB) 기본 제외한다 */
function stripTooltip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripTooltip)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'Tooltip')
        .map(([key, v]) => [key, stripTooltip(v)])
    )
  }
  return value
}

export function registerArmories(server: ToolServer) {
  for (const section of SECTIONS) {
    server.tool(
      section.tool,
      `${section.desc}를 조회한다.`,
      {
        character_name: z.string().min(1).describe('조회할 캐릭터명'),
        include_tooltip: z
          .boolean()
          .optional()
          .describe('아이템 Tooltip 원문 포함 여부. 응답이 매우 커지므로 품질·세부 옵션까지 필요할 때만 true (기본 false)'),
      },
      async ({ character_name, include_tooltip }) => {
        try {
          const data = await getClient().get(
            `/armories/characters/${encodeURIComponent(character_name)}/${section.path}`
          )
          if (data == null) return jsonError(`캐릭터 "${character_name}"의 ${section.path} 정보를 찾을 수 없어요`)
          return jsonResult(include_tooltip ? data : stripTooltip(data))
        } catch (err) {
          if (err instanceof LostArkApiError) return jsonError(err.message)
          return jsonError(`${section.path} 조회에 실패했어요`, { cause: String(err) })
        }
      }
    )
  }
}
