// Browser-side helper. Calls our own Next.js proxy (/api/admin/*),
// which adds the login token and forwards to Laravel.
export async function adminFetch<T = unknown>(path: string, init: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`/api/admin/${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init.headers ?? {}) },
    });
  } catch {
    return { ok: false, status: 0, data: {} as T };
  }

  if (res.status === 401) {
    window.location.href = "/login";
  }

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}