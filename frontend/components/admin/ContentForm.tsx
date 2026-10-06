"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, FileText } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import type { ResourceConfig } from "@/lib/resources";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-light";

type ApiError = { message?: string; errors?: Record<string, string[]> };

export default function ContentForm({
  config,
  id,
}: {
  config: ResourceConfig;
  id?: string;
}) {
  const router = useRouter();
  const editing = Boolean(id);

  const [values, setValues] = useState<Record<string, string>>({});
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null); // image
  const [preview, setPreview] = useState<string | null>(null);
  const [doc, setDoc] = useState<File | null>(null); // PDF
  const [existingDocUrl, setExistingDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");

  // Load the existing item when editing
  useEffect(() => {
    if (!id) return;
    adminFetch<Record<string, unknown>>(`${config.resource}/${id}`).then(({ ok, data }) => {
      if (!ok) {
        setMessage(`Couldn't load this ${config.singular}.`);
      } else {
        const v: Record<string, string> = {};
        config.fields.forEach((f) => (v[f.name] = String(data[f.name] ?? "")));
        setValues(v);
        setActive(Boolean(data.is_active));
        if (config.imageUrlKey) {
          setPreview((data[config.imageUrlKey] as string | null) ?? null);
        }
        if (config.fileUrlKey) {
          setExistingDocUrl((data[config.fileUrlKey] as string | null) ?? null);
        }
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, config.resource]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  function onDoc(e: React.ChangeEvent<HTMLInputElement>) {
    setDoc(e.target.files?.[0] ?? null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    // A PDF is required when creating a new publication
    if (config.fileField && !editing && !doc) {
      setErrors({ [config.fileField]: [`Please choose a ${config.fileLabel ?? "file"}.`] });
      return;
    }

    setSaving(true);
    setErrors({});

    const fd = new FormData();
    config.fields.forEach((f) => fd.append(f.name, values[f.name] ?? ""));
    fd.append("is_active", active ? "1" : "0");
    if (config.imageField && file) fd.append(config.imageField, file);
    if (config.fileField && doc) fd.append(config.fileField, doc);
    if (editing) fd.append("_method", "PUT"); // Laravel can't read files from a real PUT

    const { ok, status, data } = await adminFetch<ApiError>(
      editing ? `${config.resource}/${id}` : config.resource,
      { method: "POST", body: fd }
    );

    if (!ok) {
      if (status === 422) setErrors(data.errors ?? {});
      setMessage(data.message ?? "Couldn't save. Please try again.");
      setSaving(false);
      return;
    }

    router.push(`/dashboard/${config.resource}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/dashboard/${config.resource}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to {config.plural.toLowerCase()}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">
        {editing ? `Edit ${config.singular}` : `Add ${config.singular}`}
      </h1>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Text fields */}
          <div className="space-y-5 rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,18,48,0.06)] lg:col-span-2">
            {message && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {message}
              </p>
            )}

            {config.fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="mb-2 block text-sm font-semibold text-ink">
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    id={f.name}
                    rows={5}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className={inputCls}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={f.name}
                    required={f.required}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={f.name}
                    type={f.type}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className={inputCls}
                  />
                )}
                {f.help && <p className="mt-1.5 text-xs text-muted">{f.help}</p>}
                {errors[f.name]?.[0] && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors[f.name][0]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Upload + visibility */}
          <div className="space-y-5 rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,18,48,0.06)] lg:self-start">
            {/* Image (services, team) */}
            {config.imageField && (
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">{config.imageLabel}</span>
                <label
                  htmlFor="image"
                  className="group flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface p-4 text-center transition hover:border-brand"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="h-40 w-full rounded-lg object-contain" />
                  ) : (
                    <>
                      <ImagePlus className="text-muted group-hover:text-brand" />
                      <span className="text-sm font-medium text-ink">Choose an image</span>
                    </>
                  )}
                  {preview && <span className="text-xs font-medium text-brand">Change image</span>}
                </label>
                <input id="image" type="file" accept={config.imageAccept} onChange={onFile} className="sr-only" />
                {config.imageHelp && <p className="mt-1.5 text-xs text-muted">{config.imageHelp}</p>}
                {errors[config.imageField]?.[0] && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors[config.imageField][0]}</p>
                )}
              </div>
            )}

            {/* PDF (publications) */}
            {config.fileField && (
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">{config.fileLabel}</span>
                <label
                  htmlFor="document"
                  className="group flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface p-4 text-center transition hover:border-brand"
                >
                  <FileText className="text-muted group-hover:text-brand" />
                  {doc ? (
                    <span className="break-all text-sm font-medium text-ink">{doc.name}</span>
                  ) : existingDocUrl ? (
                    <span className="text-sm font-medium text-ink">A PDF is already uploaded</span>
                  ) : (
                    <span className="text-sm font-medium text-ink">Choose a PDF</span>
                  )}
                  {(doc || existingDocUrl) && (
                    <span className="text-xs font-medium text-brand">Replace PDF</span>
                  )}
                </label>
                <input
                  id="document"
                  type="file"
                  accept={config.fileAccept}
                  onChange={onDoc}
                  className="sr-only"
                />
                {existingDocUrl && !doc && (
                  <a
                    href={existingDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block text-xs font-medium text-brand hover:underline"
                  >
                    View current PDF
                  </a>
                )}
                {config.fileHelp && <p className="mt-1.5 text-xs text-muted">{config.fileHelp}</p>}
                {errors[config.fileField]?.[0] && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors[config.fileField][0]}</p>
                )}
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              Show on website
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
              >
                {saving ? "Saving…" : editing ? "Save changes" : `Add ${config.singular}`}
              </button>
              <Link
                href={`/dashboard/${config.resource}`}
                className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:bg-brand-light"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}