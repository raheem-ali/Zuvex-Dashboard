import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, TOKEN_COOKIE, getToken } from "@/lib/session";

export async function POST() {
  const token = await getToken();

  // Best effort: revoke the token on Laravel, then always clear the cookie
  if (token) {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    }).catch(() => {});
  }

  (await cookies()).delete(TOKEN_COOKIE);
  return NextResponse.json({ message: "Logged out." });
}