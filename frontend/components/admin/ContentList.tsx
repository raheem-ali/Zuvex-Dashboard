"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, ImageOff, FileText } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import type { ResourceConfig } from "@/lib/resources";

type Item = { id: number; is_active: boolean } & Record<string, unknown>;

export default function ContentList({ config }: { config: ResourceConfig }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const reorderable = config.reorderable !== false;

  const load = useCallback(async () => {
    const { ok, status } = await adminFetch<Item[]>(config.resource).then((r) => r);
    return { ok, status };
  }, [config.resource]);

  const loadItems = useCallback(async () => {
    const { ok, status, data } = await adminFetch<Item[]>(config.resource);
    if (!ok) {
      setError(`Couldn't load the list (status ${status}). Check that the Laravel server is running.`);
      setItems([]);
      return;
    }
    setError("");
    setItems(data);
  }, [config.resource]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function move(index: number, dir: -1 | 1) {
    if (!items) return;
    const target = index + dir;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);

    const { ok } = await adminFetch(`${config.resource}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((i) => i.id) }),
    });
    if (!ok) {
      setError("Couldn't save the new order.");
      loadItems();
    }
  }

  async function remove(item: Item) {
    const name = String(item[config.titleKey] ?? `this ${config.singular}`);
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;

    setBusyId(item.id);
    const { ok } = await adminFetch(`${config.resource}/${item.id}`, { method: "DELETE" });
    setBusyId(null);

    if (!ok) {
      setError(`Couldn't delete this ${config.singular}.`);
      return;
    }
    setItems((cur) => (cur ? cur.filter((i) => i.id !== item.id) : cur));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{config.plural}</h1>
          <p className="text-sm text-muted">{config.description}</p>
        </div>
        <Link
          href={`/dashboard/${config.resource}/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <Plus size={16} /> Add {config.singular}
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_3px_rgba(11,18,48,0.06)]">
        {items === null ? (
          <p className="p-8 text-center text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-ink">No {config.plural.toLowerCase()} yet</p>
            <p className="mt-1 text-sm text-muted">Add your first {config.singular} to show it on the website.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item, i) => {
              const img = config.imageUrlKey
                ? ((item[config.imageUrlKey] as string | null | undefined) ?? null)
                : null;
              return (
                <li key={item.id} className="flex items-center gap-4 p-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-light text-brand">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : config.fileField ? (
                      <FileText size={20} />
                    ) : (
                      <ImageOff size={20} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ink">{String(item[config.titleKey])}</p>
                      {!item.is_active && (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm text-muted">{String(item[config.subtitleKey])}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {reorderable && (
                      <>
                        <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp size={16} />
                        </IconButton>
                        <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown size={16} />
                        </IconButton>
                      </>
                    )}
                    <Link
                      href={`/dashboard/${config.resource}/${item.id}/edit`}
                      aria-label={`Edit ${String(item[config.titleKey])}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink transition hover:bg-brand-light"
                    >
                      <Pencil size={16} />
                    </Link>
                    <IconButton
                      label="Delete"
                      danger
                      disabled={busyId === item.id}
                      onClick={() => remove(item)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-9 w-9 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-ink hover:bg-brand-light"
      }`}
    >
      {children}
    </button>
  );
}