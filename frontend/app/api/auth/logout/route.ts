import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, TOKEN_COOKIE } from "@/lib/session";

export async function POST() {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;

  if (token) {
    // Revoke the token in Laravel; ignore failures so the user can still log out
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => {});
  }

  store.delete(TOKEN_COOKIE);
  return NextResponse.json({ ok: true });
}