"use client";

import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Profile = { id: number; name: string; email: string; created_at: string | null };
type Notice = { type: "ok" | "error"; text: string } | null;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api<Profile>("/admin/profile")
      .then(setProfile)
      .catch((e) => setLoadError(e.message));
  }, []);

  if (loadError) {
    return (
      <Card>
        <p className="font-semibold text-ink">Couldn&apos;t load your profile</p>
        <p className="mt-1 text-sm text-muted">{loadError}</p>
      </Card>
    );
  }
  if (!profile) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Profile</h1>
        <p className="text-sm text-muted">Manage your account details and password.</p>
      </div>

      {/* Summary */}
      <Card className="flex flex-wrap items-center gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-white">
          {initials}
        </span>
        <div>
          <p className="text-lg font-bold text-ink">{profile.name}</p>
          <p className="text-sm text-muted">{profile.email}</p>
          {profile.created_at && (
            <p className="mt-1 text-xs text-muted">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailsForm profile={profile} onSaved={setProfile} />
        <PasswordForm />
      </div>
    </div>
  );
}

/* ---------- account details ---------- */
function DetailsForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const dirty = name !== profile.name || email !== profile.email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setErrors({});
    try {
      const updated = await api<Profile>("/admin/profile", { method: "PUT", body: { name, email } });
      onSaved(updated);
      setNotice({ type: "ok", text: "Profile updated." });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setNotice({ type: "error", text: err.message });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-ink">Account details</h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Full name" icon={UserIcon} error={errors.name?.[0]}>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Email address" icon={Mail} error={errors.email?.[0]}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />
        </Field>
        <NoticeBar notice={notice} />
        <button type="submit" disabled={busy || !dirty} className={primaryBtn}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </Card>
  );
}

/* ---------- password ---------- */
function PasswordForm() {
  const empty = { current_password: "", password: "", password_confirmation: "" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setErrors({});
    try {
      await api("/admin/profile/password", { method: "PUT", body: form });
      setForm(empty);
      setNotice({ type: "ok", text: "Password updated. Other devices have been signed out." });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setNotice({ type: "error", text: err.message });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-ink">Change password</h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Current password" icon={Lock} error={errors.current_password?.[0]}>
          <input
            type="password"
            autoComplete="current-password"
            value={form.current_password}
            onChange={set("current_password")}
            required
            className={inputCls}
          />
        </Field>
        <Field label="New password" icon={Lock} error={errors.password?.[0]} hint="At least 8 characters.">
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
            className={inputCls}
          />
        </Field>
        <Field label="Confirm new password" icon={Lock}>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={set("password_confirmation")}
            required
            className={inputCls}
          />
        </Field>
        <NoticeBar notice={notice} />
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </Card>
  );
}

/* ---------- shared bits ---------- */
const inputCls =
  "w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";
const primaryBtn =
  "inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,18,48,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  hint,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <span className="relative block">
        <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        {children}
      </span>
      {error ? (
        <span className="mt-1.5 block text-xs text-brand">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const ok = notice.type === "ok";
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role="status"
      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-brand-light text-brand"
      }`}
    >
      <Icon size={16} /> {notice.text}
    </p>
  );
}