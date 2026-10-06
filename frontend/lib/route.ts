import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Server-side proxy: reads the httpOnly login cookie and forwards the request
// to Laravel with an Authorization header.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Add your cookie's exact name here (DevTools > Application > Cookies).
const COOKIE_NAMES = ["token", "auth_token", "access_token", "authToken", "session_token"];

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const jar = await cookies();

  let token: string | undefined;
  for (const name of COOKIE_NAMES) {
    const value = jar.get(name)?.value;
    if (value) {
      token = decodeURIComponent(value);
      break;
    }
  }

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.text() : undefined;

  const res = await fetch(`${BASE}/${path.join("/")}${req.nextUrl.search}`, {
    method: req.method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    cache: "no-store",
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };