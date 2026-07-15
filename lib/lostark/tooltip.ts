// 로스트아크 Tooltip(JSON 문자열) 파서.
// 원칙: 어떤 단계든 파싱에 실패하면 예외를 내지 않고 raw 값을 그대로 반환한다 (정보 유실 금지).

/** HTML 유사 마크업 제거: <BR>은 줄바꿈, img/기타 태그는 삭제 */
function stripMarkup(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<img[^>]*>(<\/img>)?/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const SKIP_KEYS = new Set(['slotData', 'iconPath', 'imagePath', 'bEquip', 'itemIrochiCount', 'pointType', 'bPoint', 'lock'])

/** 알 수 없는 구조에서 사람이 읽을 텍스트만 재귀적으로 수집하는 범용 폴백 */
function collectText(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    const text = stripMarkup(value)
    if (text && !text.startsWith('http')) out.push(text)
    return
  }
  if (Array.isArray(value)) {
    for (const v of value) collectText(v, out)
    return
  }
  if (isRecord(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (!SKIP_KEYS.has(k)) collectText(v, out)
    }
  }
}

/** '|' 구분 문자열 (MultiTextBox, ShowMeTheMoney) */
function parseSegmented(value: string): string {
  return value
    .split('|')
    .map(stripMarkup)
    .filter(Boolean)
    .join(' / ')
}

/** Element_000, Element_001, ... 순서대로 값을 꺼낸다 */
function orderedValues(record: Record<string, unknown>): unknown[] {
  return Object.keys(record)
    .sort()
    .map((k) => record[k])
}

function parseIndentGroup(value: unknown): string {
  const out: string[] = []
  if (isRecord(value)) {
    for (const group of orderedValues(value)) {
      if (!isRecord(group)) continue
      if (typeof group.topStr === 'string') out.push(stripMarkup(group.topStr))
      if (isRecord(group.contentStr)) {
        for (const entry of orderedValues(group.contentStr)) {
          if (isRecord(entry) && typeof entry.contentStr === 'string') out.push(stripMarkup(entry.contentStr))
        }
      }
    }
  }
  return out.filter(Boolean).join('\n')
}

/** element 타입별 파싱 규칙. 문자열(또는 빈 문자열=버림)을 반환 */
function parseElement(type: string, value: unknown): string {
  switch (type) {
    case 'NameTagBox':
    case 'SingleTextBox':
      return typeof value === 'string' ? stripMarkup(value) : ''
    case 'MultiTextBox':
    case 'ShowMeTheMoney':
      return typeof value === 'string' ? parseSegmented(value) : ''
    case 'ItemTitle': {
      if (!isRecord(value)) return ''
      const parts: string[] = []
      for (const key of ['leftStr0', 'leftStr2'] as const) {
        if (typeof value[key] === 'string') parts.push(stripMarkup(value[key] as string))
      }
      if (typeof value.qualityValue === 'number' && value.qualityValue >= 0) parts.push(`품질 ${value.qualityValue}`)
      return parts.filter(Boolean).join(' | ')
    }
    case 'ItemPartBox': {
      if (!isRecord(value)) return ''
      const [head, ...rest] = orderedValues(value).map((v) => (typeof v === 'string' ? stripMarkup(v) : ''))
      const body = rest.filter(Boolean).join('\n')
      return head && body ? `${head}: ${body}` : head || body
    }
    case 'Progress': {
      if (!isRecord(value)) return ''
      const title = typeof value.title === 'string' ? stripMarkup(value.title) : ''
      const current = typeof value.value === 'number' ? value.value : null
      const max = typeof value.maximum === 'number' ? value.maximum : null
      return title && current !== null && max !== null ? `${title}: ${current}/${max}` : title
    }
    case 'IndentStringGroup':
      return parseIndentGroup(value)
    case 'CommonSkillTitle': {
      if (!isRecord(value)) return ''
      const parts = ['level', 'name', 'leftText', 'middleText']
        .map((k) => (typeof value[k] === 'string' ? stripMarkup(value[k] as string) : ''))
        .filter(Boolean)
      return parts.join(' | ')
    }
    case 'TripodSkillCustom': {
      if (!isRecord(value)) return ''
      const out: string[] = []
      for (const tripod of orderedValues(value)) {
        if (!isRecord(tripod)) continue
        const name = typeof tripod.name === 'string' ? stripMarkup(tripod.name) : ''
        const desc = typeof tripod.desc === 'string' ? stripMarkup(tripod.desc) : ''
        if (name || desc) out.push(name && desc ? `[${name}] ${desc}` : name || desc)
      }
      return out.join('\n')
    }
    case 'BlinkLineStart':
    case 'BlinkLineEnd':
      return ''
    default: {
      // 미지의 타입: 범용 텍스트 수집 폴백
      const out: string[] = []
      collectText(value, out)
      return out.join('\n')
    }
  }
}

/**
 * Tooltip 원문(JSON 문자열 또는 마크업 문자열)을 압축된 텍스트 라인 배열로 변환한다.
 * 파싱에 실패하면 raw 문자열을 그대로 반환한다.
 */
export function parseTooltip(raw: string): string[] | string {
  try {
    if (!raw.trimStart().startsWith('{')) return stripMarkup(raw)
    const elements: unknown = JSON.parse(raw)
    if (!isRecord(elements)) return stripMarkup(raw)
    const lines: string[] = []
    for (const element of orderedValues(elements)) {
      if (!isRecord(element) || typeof element.type !== 'string') continue
      const text = parseElement(element.type, element.value)
      if (text) lines.push(text)
    }
    return lines.length > 0 ? lines : raw
  } catch {
    return raw
  }
}

/** 데이터 트리를 순회하며 모든 Tooltip 필드를 파싱 결과로 교체한다 */
export function parseTooltipsDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(parseTooltipsDeep)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => {
        if (key === 'Tooltip') {
          if (typeof v === 'string') return [key, parseTooltip(v)]
          if (Array.isArray(v)) return [key, v.map((s) => (typeof s === 'string' ? parseTooltip(s) : parseTooltipsDeep(s)))]
        }
        return [key, parseTooltipsDeep(v)]
      })
    )
  }
  return value
}
