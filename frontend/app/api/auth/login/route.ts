import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, TOKEN_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  let res: Response;
  try {
    res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        remember: Boolean(body.remember),
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Can't reach the server. Please try again." },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message ?? "Sign in failed." },
      { status: res.status }
    );
  }

  const store = await cookies();
  store.set(TOKEN_COOKIE, data.token, {
    httpOnly: true, // JavaScript in the browser can't read it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // "Keep me logged in" -> 30 days, otherwise a session cookie
    ...(body.remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  return NextResponse.json({ user: data.user });
}