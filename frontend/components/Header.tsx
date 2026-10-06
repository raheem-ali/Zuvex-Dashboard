"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  MessageCircle,
  ChevronDown,
  Menu,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { api } from "@/lib/api";

type User = { id: number; name: string; email: string };

type Recent = {
  id: number;
  item: string;
  section: string;
  action: string;
  at: string | null;
};

type Panel = "search" | "notif" | "msg" | "user" | null;

const PAGES = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Services", href: "/dashboard/services" },
  { label: "Team", href: "/dashboard/team" },
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Publications", href: "/dashboard/publications" },
  { label: "Profile", href: "/dashboard/profile" },
];

const SEEN_KEY = "zuvex_notifications_seen";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Header({
  user,
  onMenu,
}: {
  user: User;
  onMenu: () => void;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<Recent[]>([]);
  const [seenAt, setSeenAt] = useState<number>(0);

  // Load recent activity for the notification bell
  useEffect(() => {
    let cancelled = false;
    try {
      setSeenAt(Number(localStorage.getItem(SEEN_KEY) ?? 0));
    } catch {}
    api<{ recent: Recent[] }>("/admin/dashboard")
      .then((d) => {
        if (!cancelled) setRecent(d.recent ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close any open panel with Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPanel(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [query]);

  const unread = recent.filter(
    (r) => r.at && new Date(r.at).getTime() > seenAt
  ).length;

  function openNotifications() {
    const opening = panel !== "notif";
    setPanel(opening ? "notif" : null);
    if (opening) {
      const now = Date.now();
      setSeenAt(now);
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {}
    }
  }

  function go(href: string) {
    setPanel(null);
    setQuery("");
    router.push(href);
  }

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-line bg-white px-4 sm:px-8">
      {/* click-outside layer */}
      {panel && (
        <div className="fixed inset-0 z-40" onClick={() => setPanel(null)} />
      )}

      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-lg border border-line p-2 text-ink lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative z-50 flex-1">
        <div className="flex items-center gap-3 text-muted">
          <Search size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPanel("search");
            }}
            onFocus={() => setPanel("search")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].href);
              if (e.key === "Escape") {
                setQuery("");
                setPanel(null);
              }
            }}
            placeholder="Type to search…"
            className="w-full max-w-md bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
          />
        </div>

        {panel === "search" && query.trim() && (
          <div className="absolute left-0 top-full mt-3 w-full max-w-md rounded-xl border border-line bg-white p-1.5 shadow-lg">
            {results.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-muted">
                No pages match “{query}”.
              </p>
            ) : (
              results.map((r) => (
                <button
                  key={r.href}
                  onClick={() => go(r.href)}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-brand-light"
                >
                  {r.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications */}
        <div className="relative z-50">
          <IconBtn
            label="Notifications"
            dot={unread > 0}
            onClick={openNotifications}
          >
            <Bell size={18} />
          </IconBtn>

          {panel === "notif" && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl border border-line bg-white p-1.5 shadow-lg">
              <p className="px-3 py-2 text-sm font-semibold text-ink">
                Recent activity
              </p>
              {recent.length === 0 ? (
                <p className="px-3 pb-3 text-sm text-muted">
                  Nothing new yet.
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {recent.map((r) => (
                    <li key={`${r.section}-${r.id}`}>
                      <button
                        onClick={() => go(`/dashboard/${r.section}`)}
                        className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-brand-light"
                      >
                        <span className="block text-sm font-medium text-ink">
                          {r.action}: {r.item}
                        </span>
                        <span className="block text-xs capitalize text-muted">
                          {r.section} · {timeAgo(r.at)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        
        {/* User menu */}
        <div className="relative z-50 ml-2">
          <button
            onClick={() => setPanel(panel === "user" ? null : "user")}
            className="flex items-center gap-3"
            aria-haspopup="menu"
            aria-expanded={panel === "user"}
          >
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-ink">
                {user.name}
              </span>
              <span className="block text-xs text-muted">{user.email}</span>
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-sm font-bold text-white">
              {initials(user.name)}
            </span>
            <ChevronDown size={16} className="hidden text-muted sm:block" />
          </button>

          {panel === "user" && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-48 rounded-xl border border-line bg-white p-1.5 shadow-lg"
            >
              <Link
                href="/dashboard/profile"
                role="menuitem"
                onClick={() => setPanel(null)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-brand-light"
              >
                <UserIcon size={16} />
                Profile
              </Link>
              <button
                role="menuitem"
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-brand-light disabled:opacity-60"
              >
                <LogOut size={16} />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  label,
  dot = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative grid h-10 w-10 place-items-center rounded-full bg-brand-light text-navy transition hover:bg-line"
    >
      {children}
      {dot && (
        <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
      )}
    </button>
  );
}