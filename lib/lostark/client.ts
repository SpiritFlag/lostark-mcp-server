const BASE_URL = "https://developer-lostark.game.onstove.com";

export class LostArkApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "LostArkApiError";
  }
}

export class LostArkClient {
  constructor(private readonly apiKey: string) {}

  async get(path: string): Promise<unknown> {
    return this.request("GET", path);
  }

  async post(path: string, body: unknown): Promise<unknown> {
    return this.request("POST", path, body);
  }

  private async request(method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        authorization: `bearer ${this.apiKey}`,
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new LostArkApiError(this.errorMessage(response), response.status);
    }
    return response.json();
  }

  private errorMessage(response: Response): string {
    switch (response.status) {
      case 401:
        return "로스트아크 API 인증에 실패했습니다. API_KEY가 올바른지 확인해주세요. (401)";
      case 404:
        return "요청한 리소스를 찾을 수 없습니다. 경로 또는 이름을 확인해주세요. (404)";
      case 429: {
        const reset = response.headers.get("x-ratelimit-reset");
        const resetAt = reset ? new Date(Number(reset) * 1000).toISOString() : "잠시 후";
        return `API 호출 한도(분당 100회)를 초과했습니다. ${resetAt}에 초기화됩니다. (429)`;
      }
      default:
        return `로스트아크 API 요청이 실패했습니다. (${response.status} ${response.statusText})`;
    }
  }
}
