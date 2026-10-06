"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  FolderKanban,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";

/* ---------- types (match DashboardController response) ---------- */
type Section = "services" | "team" | "projects" | "publications";
type Point = { label: string; added: number; edited: number };
type DashboardData = {
  stats: Record<Section, { total: number; hidden: number; downloads?: number }>;
  last_updated: string | null;
  months: Point[];
  week: Point[];
  recent: { id: number; item: string; section: Section; action: string; at: string }[];
};

const SECTION_LABEL: Record<Section, string> = {
  services: "Services",
  team: "Team",
  projects: "Projects",
  publications: "Publications",
};
const SECTION_HREF: Record<Section, string> = {
  services: "/dashboard/services",
  team: "/dashboard/team",
  projects: "/dashboard/projects",
  publications: "/dashboard/publications",
};

/* ---------- helpers ---------- */
function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function niceMax(values: number[]) {
  const max = Math.max(0, ...values);
  return Math.max(5, Math.ceil(max / 5) * 5);
}

/* ---------- page ---------- */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"Week" | "Month">("Month");

  useEffect(() => {
    api<DashboardData>("/admin/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card>
        <p className="font-semibold text-ink">Couldn&apos;t load the dashboard</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </Card>
    );
  }
  if (!data) return <DashboardSkeleton />;

  const { stats, last_updated, months, week, recent } = data;

  const cards: { label: string; section: Section; icon: LucideIcon; extra?: string }[] = [
    { label: "Services", section: "services", icon: Briefcase },
    { label: "Team members", section: "team", icon: Users },
    { label: "Projects", section: "projects", icon: FolderKanban },
    {
      label: "Publications",
      section: "publications",
      icon: BookOpen,
      extra: `${stats.publications.downloads ?? 0} downloads`,
    },
  ];

  const series = range === "Month" ? months : week;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-muted">
            Manage the content shown on your website.
            {last_updated && <> Last updated {timeAgo(last_updated).toLowerCase()}.</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/services/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus size={16} /> Add service
          </Link>
          <Link
            href="/dashboard/team/new"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-light"
          >
            <Plus size={16} /> Add team member
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, section, icon: Icon, extra }) => {
          const { total, hidden } = stats[section];
          const allLive = hidden === 0;
          return (
            <Link
              key={section}
              href={SECTION_HREF[section]}
              className="rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,18,48,0.06)] transition hover:border-brand"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-light text-brand">
                <Icon size={20} />
              </span>
              <p className="mt-5 text-3xl font-bold text-ink">{total}</p>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted">{label}</span>
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    allLive ? "text-emerald-600" : "text-brand"
                  }`}
                >
                  {allLive ? extra ?? "All live" : `${hidden} hidden`}
                  {allLive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Charts */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-8">
              <Legend
                color="bg-brand"
                title="Items added"
                range={`${series[0]?.label} – ${series[series.length - 1]?.label}`}
              />
              <Legend color="bg-sky-400" title="Items edited" range="Same period" />
            </div>
            <div className="inline-flex rounded-lg bg-surface p-1 text-sm font-medium">
              {(["Week", "Month"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRange(t)}
                  className={`rounded-md px-3 py-1.5 ${
                    range === t ? "bg-white text-ink shadow-sm" : "text-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <AreaChart points={series} />
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Activity this week</h2>
            <span className="text-sm text-muted">Last 7 days</span>
          </div>
          <div className="mt-4 flex gap-5 text-sm text-muted">
            <span className="flex items-center gap-2">
              <i className="h-3 w-3 rounded-full bg-brand" /> Added
            </span>
            <span className="flex items-center gap-2">
              <i className="h-3 w-3 rounded-full bg-sky-400" /> Edited
            </span>
          </div>
          <BarChart points={week} />
        </Card>
      </section>

      {/* Recent changes */}
      <Card>
        <h2 className="text-xl font-bold text-ink">Recent changes</h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing yet. Add a service or team member and it will show up here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-3 font-medium">Item</th>
                  <th className="py-3 font-medium">Section</th>
                  <th className="py-3 font-medium">Action</th>
                  <th className="py-3 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={`${r.section}-${r.id}`} className="border-b border-line last:border-0">
                    <td className="py-3.5 font-medium text-ink">{r.item}</td>
                    <td className="py-3.5">
                      <Link
                        href={SECTION_HREF[r.section]}
                        className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand"
                      >
                        {SECTION_LABEL[r.section]}
                      </Link>
                    </td>
                    <td className="py-3.5 text-muted">{r.action}</td>
                    <td className="py-3.5 text-right text-muted">{timeAgo(r.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- small pieces ---------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,18,48,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function Legend({ color, title, range }: { color: string; title: string; range: string }) {
  return (
    <div className="flex items-start gap-3">
      <i className={`mt-1.5 h-3 w-3 rounded-full ${color}`} />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted">{range}</p>
      </div>
    </div>
  );
}

function AreaChart({ points }: { points: Point[] }) {
  const W = 700, H = 280, padL = 36, padB = 28, padT = 10, padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = niceMax(points.flatMap((p) => [p.added, p.edited]));
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => Math.round((max / 5) * i));

  const x = (i: number) => padL + (i * innerW) / Math.max(points.length - 1, 1);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const line = (d: number[]) => d.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = (d: number[]) => `${line(d)} L${x(d.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const edited = points.map((p) => p.edited);
  const added = points.map((p) => p.added);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-6 h-auto w-full"
      role="img"
      aria-label="Items added and edited over time"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
            {t}
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
          {p.label}
        </text>
      ))}

      <path d={area(edited)} fill="#38bdf8" fillOpacity="0.18" />
      <path d={line(edited)} fill="none" stroke="#38bdf8" strokeWidth="2" />
      <path d={area(added)} fill="var(--color-brand)" fillOpacity="0.2" />
      <path d={line(added)} fill="none" stroke="var(--color-brand)" strokeWidth="2" />

      {edited.map((v, i) => (
        <circle key={`e${i}`} cx={x(i)} cy={y(v)} r="4" fill="white" stroke="#38bdf8" strokeWidth="2">
          <title>{`${points[i].label}: ${v} edited`}</title>
        </circle>
      ))}
      {added.map((v, i) => (
        <circle key={`a${i}`} cx={x(i)} cy={y(v)} r="4" fill="white" stroke="var(--color-brand)" strokeWidth="2">
          <title>{`${points[i].label}: ${v} added`}</title>
        </circle>
      ))}
    </svg>
  );
}

function BarChart({ points }: { points: Point[] }) {
  const max = niceMax(points.map((p) => p.added + p.edited));
  const ticks = [5, 4, 3, 2, 1, 0].map((i) => Math.round((max / 5) * i));

  return (
    <div className="mt-6 flex h-64 gap-3">
      <div className="flex flex-col justify-between pb-6 text-xs text-muted">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="flex flex-1 items-end justify-between border-b border-line pb-0">
        {points.map((p, i) => (
          <div key={i} className="flex h-full flex-col items-center justify-end gap-2">
            <div className="flex w-5 flex-1 flex-col justify-end" title={`${p.added} added, ${p.edited} edited`}>
              <div className="rounded-t-sm bg-sky-400" style={{ height: `${(p.edited / max) * 100}%` }} />
              <div className="bg-brand" style={{ height: `${(p.added / max) * 100}%` }} />
            </div>
            <span className="h-4 text-xs text-muted">{p.label.charAt(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-64 rounded-lg bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-surface" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-surface" />
    </div>
  );
}