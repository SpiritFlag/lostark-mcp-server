import { z } from 'zod'
import { getClient, LostArkApiError } from '../lostark/client'
import { jsonError, jsonResult, type ToolServer } from './index'

const CATEGORY_GUIDE =
  '10100 장비 상자, 20000 아바타, 40000 각인서, 50000 강화 재료, 60000 전투 용품, 70000 요리, ' +
  '90000 생활, 100000 모험의 서, 110000 항해, 140000 펫, 160000 탈것, 170000 기타, 220000 보석 상자'

export function registerSearchMarketItems(server: ToolServer) {
  server.tool(
    'search_market_items',
    '거래소에서 아이템 시세를 검색한다. 각인서 시세 조회가 대표 용도. ' +
      '아이템별 현재 최저가(CurrentMinPrice), 최근 거래가(RecentPrice), 전일 평균가(YDayAvgPrice)를 반환.',
    {
      category_code: z
        .number()
        .int()
        .optional()
        .describe(`거래소 카테고리 코드. 생략 시 40000(각인서). 코드: ${CATEGORY_GUIDE}`),
      item_name: z.string().optional().describe('아이템명 (부분 일치). 예: "아드레날린"'),
      item_grade: z
        .enum(['일반', '고급', '희귀', '영웅', '전설', '유물', '고대', '에스더'])
        .optional()
        .describe('아이템 등급 필터. 각인서 시세는 보통 "유물"'),
      item_tier: z.number().int().optional().describe('아이템 티어 필터 (2, 3, 4)'),
      page_no: z.number().int().min(1).optional().describe('페이지 번호 (기본 1, 페이지당 10개)'),
      sort: z
        .enum(['GRADE', 'YDAY_AVG_PRICE', 'RECENT_PRICE', 'CURRENT_MIN_PRICE'])
        .optional()
        .describe('정렬 기준 (기본 CURRENT_MIN_PRICE)'),
      sort_condition: z.enum(['ASC', 'DESC']).optional().describe('정렬 방향 (기본 DESC)'),
    },
    async ({ category_code, item_name, item_grade, item_tier, page_no, sort, sort_condition }) => {
      try {
        const data = await getClient().post('/markets/items', {
          CategoryCode: category_code ?? 40000,
          ItemName: item_name,
          ItemGrade: item_grade,
          ItemTier: item_tier,
          PageNo: page_no ?? 1,
          Sort: sort ?? 'CURRENT_MIN_PRICE',
          SortCondition: sort_condition ?? 'DESC',
        })
        if (data == null) return jsonError('거래소 검색 결과를 받지 못했어요')
        return jsonResult(data)
      } catch (err) {
        if (err instanceof LostArkApiError) return jsonError(err.message)
        return jsonError('거래소 검색에 실패했어요', { cause: String(err) })
      }
    }
  )
}
