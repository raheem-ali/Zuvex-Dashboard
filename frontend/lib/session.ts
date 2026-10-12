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
  if (!token) {
    console.log("[session] no", TOKEN_COOKIE, "cookie");
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.log("[session] /me failed:", res.status, `${API_URL}/me`);
      return null;
    }
    return (await res.json()) as SessionUser;
  } catch (err) {
    console.log("[session] could not reach", `${API_URL}/me`, err);
    return null;
  }
}