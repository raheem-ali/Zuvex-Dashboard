// Fetch wrapper. Requests go through the Next.js proxy (app/api/proxy/[...path]/route.ts),
// which attaches the Sanctum token from the httpOnly cookie on the server.
const BASE = "/api";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // No automatic redirect on 401: it caused a /login <-> /dashboard loop.
  // The page shows the error instead.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status === 401 ? "Your session isn't valid. Please sign out and log in again." : data.message ?? "Something went wrong.",
      res.status,
      data.errors ?? {}
    );
  }
  return data as T;
}