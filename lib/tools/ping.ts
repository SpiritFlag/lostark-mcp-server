import { jsonResult, type ToolServer } from './index'

export function registerPing(server: ToolServer) {
  server.tool('ping', "서버 동작 확인용 툴. 항상 'pong'을 반환한다.", {}, async () =>
    jsonResult({ message: 'pong' })
  )
}
