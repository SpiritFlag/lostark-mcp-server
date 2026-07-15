export interface Config {
  apiKey: string;
  authToken: string;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env.API_KEY;
  if (!apiKey) {
    throw new Error("환경변수 API_KEY가 설정되지 않았습니다. 로스트아크 오픈 API 키를 API_KEY에 넣어주세요.");
  }
  const authToken = env.AUTH_TOKEN;
  if (!authToken) {
    throw new Error("환경변수 AUTH_TOKEN이 설정되지 않았습니다. MCP 접속용 비밀 토큰을 AUTH_TOKEN에 넣어주세요.");
  }
  const port = env.PORT ? Number(env.PORT) : 3000;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`환경변수 PORT 값이 올바르지 않습니다: ${env.PORT}`);
  }
  return { apiKey, authToken, port };
}
