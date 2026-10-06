import { NextResponse, type NextRequest } from "next/server";
import { API_URL, getToken } from "@/lib/session";

// Forwards /api/admin/* from the browser to Laravel's /api/admin/*,
// adding the token from the httpOnly cookie. Works for JSON and file uploads.
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { path } = await params;
  const url = `${API_URL}/admin/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType; // keeps the multipart boundary

  const hasBody = !["GET", "HEAD"].includes(req.method);

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Can't reach the server. Please try again." },
      { status: 502 }
    );
  }

  // Content changed -> tell the website (a separate project) to refresh its home page
  if (req.method !== "GET" && res.ok && process.env.WEBSITE_URL && process.env.REVALIDATE_SECRET) {
    await fetch(`${process.env.WEBSITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": process.env.REVALIDATE_SECRET },
    }).catch(() => {});
  }

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };