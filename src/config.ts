export interface Config {
  apiKey: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env.API_KEY;
  if (!apiKey) {
    throw new Error("환경변수 API_KEY가 설정되지 않았습니다. 로스트아크 오픈 API 키를 API_KEY에 넣어주세요.");
  }
  return { apiKey };
}
