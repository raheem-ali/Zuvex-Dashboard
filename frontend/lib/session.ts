import { cookies } from "next/headers";

export const API_URL = process.env.API_URL ?? "http://localhost:8000/api";
export const TOKEN_COOKIE = "admin_token";

export type SessionUser = { id: number; name: string; email: string };

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

/** Asks Laravel who the current token belongs to. Returns null if not logged in. */
export async function getUser(): Promise<SessionUser | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionUser;
  } catch {
    return null;
  }
}