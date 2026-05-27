type TokenPayload = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
};

type ResolveTokenFn = () => Promise<TokenPayload>;

export class TokenManager {
  private cachedToken: TokenPayload | null = null;
  private inflightRefresh: Promise<TokenPayload> | null = null;

  constructor(
    private readonly resolveToken: ResolveTokenFn,
    private readonly clockSkewMs: number = 5_000,
  ) {}

  private isTokenValid(token: TokenPayload | null): token is TokenPayload {
    if (!token) {
      return false;
    }

    return token.expiresAt - this.clockSkewMs > Date.now();
  }

  async getToken(): Promise<string> {
    if (this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.accessToken;
    }

    if (!this.inflightRefresh) {
      this.inflightRefresh = this.resolveToken()
        .then((token) => {
          this.cachedToken = token;
          return token;
        })
        .finally(() => {
          this.inflightRefresh = null;
        });
    }

    const token = await this.inflightRefresh;
    return token.accessToken;
  }

  clear(): void {
    this.cachedToken = null;
  }
}

export type { TokenPayload, ResolveTokenFn };
