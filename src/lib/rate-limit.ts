// Login rate limiting rules (pure). The counts come from the login_attempts table.

export const LOGIN_WINDOW_MINUTES = 15;
export const MAX_FAILURES_PER_EMAIL = 5; // per account, reset by a successful login
export const MAX_FAILURES_PER_IP = 30; // per network, across all accounts

export function isLoginLimited({ emailFailures, ipFailures }: { emailFailures: number; ipFailures: number }) {
  return emailFailures >= MAX_FAILURES_PER_EMAIL || ipFailures >= MAX_FAILURES_PER_IP;
}

/** First address in X-Forwarded-For (the client), else the real IP header. */
export function clientIp(headers: { get(name: string): string | null }) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || null;
}
