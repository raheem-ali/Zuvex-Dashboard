"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { PROJECT_CATEGORIES } from "@/lib/resources";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-light";
const cardCls =
  "rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,18,48,0.06)]";

type ApiError = { message?: string; errors?: Record<string, string[]> };
type Result = { value: string; label: string };
type GalleryItem = { path: string; url: string };
type NewImage = { file: File; url: string };

export default function ProjectForm({ id }: { id?: string }) {
  const router = useRouter();
  const editing = Boolean(id);

  const [text, setText] = useState({
    title: "",
    summary: "",
    year: String(new Date().getFullYear()),
    client: "",
    duration: "",
    overview: "",
    challenge: "",
    solution: "",
  });
  const [primary, setPrimary] = useState(PROJECT_CATEGORIES[0].slug);
  const [extras, setExtras] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [objectives, setObjectives] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    adminFetch<Record<string, unknown>>(`projects/${id}`).then(({ ok, data }) => {
      if (!ok) {
        setMessage("Couldn't load this project.");
      } else {
        const s = (k: string) => String(data[k] ?? "");
        setText({
          title: s("title"),
          summary: s("summary"),
          year: s("year"),
          client: s("client"),
          duration: s("duration"),
          overview: s("overview"),
          challenge: s("challenge"),
          solution: s("solution"),
        });
        const cats = (data.categories as string[]) ?? [];
        if (cats[0]) setPrimary(cats[0]);
        setExtras(cats.slice(1));
        setTags(((data.tags as string[]) ?? []).join(", "));
        setObjectives(((data.objectives as string[]) ?? []).join("\n"));
        setResults((data.results as Result[]) ?? []);
        setCoverPreview((data.cover_url as string | null) ?? null);
        const paths = (data.gallery as string[]) ?? [];
        const urls = (data.gallery_urls as string[]) ?? [];
        setGallery(paths.map((path, i) => ({ path, url: urls[i] })));
        setActive(Boolean(data.is_active));
      }
      setLoading(false);
    });
  }, [id]);

  const setField = (k: keyof typeof text, v: string) => setText((t) => ({ ...t, [k]: v }));

  function toggleExtra(slug: string) {
    setExtras((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  }

  function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setCover(f);
    if (f) setCoverPreview(URL.createObjectURL(f));
  }

  function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setNewImages((cur) => [...cur, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage("");

    const lines = (v: string, sep: RegExp) => v.split(sep).map((t) => t.trim()).filter(Boolean);

    const fd = new FormData();
    Object.entries(text).forEach(([k, v]) => fd.append(k, v));
    fd.append("categories", JSON.stringify([primary, ...extras.filter((x) => x !== primary)]));
    fd.append("tags", JSON.stringify(lines(tags, /,/)));
    fd.append("objectives", JSON.stringify(lines(objectives, /\n/)));
    fd.append(
      "results",
      JSON.stringify(
        results
          .filter((r) => r.value.trim() && r.label.trim())
          .map((r) => ({ value: r.value.trim(), label: r.label.trim() }))
      )
    );
    fd.append("remove_gallery", JSON.stringify(removed));
    fd.append("is_active", active ? "1" : "0");
    if (cover) fd.append("cover", cover);
    newImages.forEach((n) => fd.append("gallery_files[]", n.file));
    if (editing) fd.append("_method", "PUT");

    const { ok, status, data } = await adminFetch<ApiError>(
      editing ? `projects/${id}` : "projects",
      { method: "POST", body: fd }
    );

    if (!ok) {
      if (status === 422) setErrors(data.errors ?? {});
      setMessage(data.message ?? "Couldn't save. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/projects");
    router.refresh();
  }

  const errorList = Object.values(errors).flat();

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to projects
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">{editing ? "Edit project" : "Add project"}</h1>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {(message || errorList.length > 0) && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-semibold">{message}</p>
                {errorList.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {errorList.map((er, i) => (
                      <li key={i}>{er}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className={`${cardCls} space-y-5`}>
              <Field label="Title">
                <input required value={text.title} onChange={(e) => setField("title", e.target.value)} className={inputCls} placeholder="e.g. AI-Based Sentiment Analysis" />
              </Field>
              <Field label="Short description" help="Shown on the portfolio card and at the top of the project page.">
                <textarea required rows={3} value={text.summary} onChange={(e) => setField("summary", e.target.value)} className={inputCls} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Year">
                  <input required type="number" value={text.year} onChange={(e) => setField("year", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Client (optional)">
                  <input value={text.client} onChange={(e) => setField("client", e.target.value)} className={inputCls} placeholder="e.g. Academic Project" />
                </Field>
                <Field label="Duration (optional)">
                  <input value={text.duration} onChange={(e) => setField("duration", e.target.value)} className={inputCls} placeholder="e.g. 4 Months" />
                </Field>
              </div>
            </div>

            <div className={`${cardCls} space-y-5`}>
              <Field label="Main category" help="Shown as the colored badge on the card.">
                <select value={primary} onChange={(e) => setPrimary(e.target.value)} className={inputCls}>
                  {PROJECT_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">Also show under these filters (optional)</span>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_CATEGORIES.filter((c) => c.slug !== primary).map((c) => {
                    const on = extras.includes(c.slug);
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => toggleExtra(c.slug)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                          on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-brand-light"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Technologies / tags" help="Separate with commas, e.g. Laravel, MySQL, Bootstrap">
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} />
              </Field>
            </div>

            <div className={`${cardCls} space-y-5`}>
              <h2 className="text-lg font-bold text-ink">Project page content</h2>
              <Field label="Overview" help="Leave empty to hide this section.">
                <textarea rows={4} value={text.overview} onChange={(e) => setField("overview", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Objectives" help="One objective per line.">
                <textarea rows={4} value={objectives} onChange={(e) => setObjectives(e.target.value)} className={inputCls} />
              </Field>
              <Field label="The challenge">
                <textarea rows={4} value={text.challenge} onChange={(e) => setField("challenge", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Our solution">
                <textarea rows={4} value={text.solution} onChange={(e) => setField("solution", e.target.value)} className={inputCls} />
              </Field>
            </div>

            <div className={`${cardCls} space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">Results &amp; impact</h2>
                  <p className="text-xs text-muted">e.g. value “99.2%” with label “Model Accuracy”.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setResults((r) => [...r, { value: "", label: "" }])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-brand-light"
                >
                  <Plus size={15} /> Add result
                </button>
              </div>
              {results.length === 0 && <p className="text-sm text-muted">No results added. This section will be hidden.</p>}
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    value={r.value}
                    onChange={(e) => setResults((cur) => cur.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    placeholder="Value (99.2%)"
                    className={`${inputCls} max-w-[160px]`}
                  />
                  <input
                    value={r.label}
                    onChange={(e) => setResults((cur) => cur.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Label (Model Accuracy)"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    aria-label="Remove result"
                    onClick={() => setResults((cur) => cur.filter((_, j) => j !== i))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:self-start">
            <div className={`${cardCls} space-y-5`}>
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">Cover image</span>
                <label
                  htmlFor="cover"
                  className="group flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface p-4 text-center transition hover:border-brand"
                >
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="Cover preview" className="h-40 w-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <ImagePlus className="text-muted group-hover:text-brand" />
                      <span className="text-sm font-medium text-ink">Choose an image</span>
                    </>
                  )}
                  {coverPreview && <span className="text-xs font-medium text-brand">Change image</span>}
                </label>
                <input id="cover" type="file" accept="image/png,image/jpeg,image/webp" onChange={onCover} className="sr-only" />
                <p className="mt-1.5 text-xs text-muted">Landscape JPG, PNG or WebP. Max 4 MB.</p>
              </div>

              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">Gallery images</span>
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((g) => (
                    <Thumb
                      key={g.path}
                      src={g.url}
                      onRemove={() => {
                        setGallery((cur) => cur.filter((x) => x.path !== g.path));
                        setRemoved((cur) => [...cur, g.path]);
                      }}
                    />
                  ))}
                  {newImages.map((n, i) => (
                    <Thumb key={n.url} src={n.url} onRemove={() => setNewImages((cur) => cur.filter((_, j) => j !== i))} />
                  ))}
                  <label
                    htmlFor="gallery"
                    className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line bg-surface text-muted transition hover:border-brand hover:text-brand"
                  >
                    <Plus size={20} />
                  </label>
                </div>
                <input id="gallery" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={onGallery} className="sr-only" />
                <p className="mt-1.5 text-xs text-muted">You can select several at once. Max 4 MB each.</p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand" />
                Show on website
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Add project"}
                </button>
                <Link href="/dashboard/projects" className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:bg-brand-light">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {help && <span className="mt-1.5 block text-xs text-muted">{help}</span>}
    </label>
  );
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label="Remove image"
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-navy/80 text-white opacity-0 transition group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}