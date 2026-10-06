"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Briefcase,
  Users,
  FolderKanban,
  FileText,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

type Item = { label: string; href: string; icon: LucideIcon };

const content: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Services", href: "/dashboard/services", icon: Briefcase },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Publications", href: "/dashboard/publications", icon: FileText },
];

const account: Item[] = [
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-navy/60 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-7 pb-6 pt-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand">
              <LayoutGrid size={18} />
            </span>
            <span className="text-2xl font-bold tracking-tight">Zuvex Hub</span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-white/70 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          <Group title="Content" items={content} pathname={pathname} onNav={onClose} />
          <Group title="Account" items={account} pathname={pathname} onNav={onClose} />
        </nav>
      </aside>
    </>
  );
}

function Group({
  title,
  items,
  pathname,
  onNav,
}: {
  title: string;
  items: Item[];
  pathname: string;
  onNav: () => void;
}) {
  return (
    <div className="mt-6 first:mt-2">
      <p className="mb-3 px-3 text-sm font-semibold text-white/50">{title}</p>
      <ul className="space-y-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNav}
                className={`flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
                  active
                    ? "bg-navy-2 text-white ring-1 ring-white/5"
                    : "text-white/70 hover:bg-navy-2 hover:text-white"
                }`}
              >
                <Icon size={20} className={active ? "text-brand" : ""} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}