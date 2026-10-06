"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, LayoutGrid } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          remember: form.get("remember") === "on",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? "Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-[#9aa3b5]";

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
          <LayoutGrid size={20} />
        </span>
        <span className="text-2xl font-bold tracking-tight text-navy">
          YourBrand
        </span>
      </div>

      <p className="mt-10 text-sm font-medium text-muted">
        Sign in to manage your website content
      </p>

      <div className="mt-8 w-full max-w-[448px]">
        {/* Card */}
        <form
          onSubmit={onSubmit}
          className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_10px_40px_-12px_rgba(11,18,48,0.12)]"
        >
          <div className="h-1.5 bg-brand" />
          <div className="space-y-5 p-8">
            <Field label="Email address" icon={<Mail size={18} />}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="admin@yourbrand.com"
                className={inputClass}
              />
            </Field>

            <Field
              label="Password"
              icon={<Lock size={18} />}
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                className={inputClass}
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-line accent-brand"
              />
              Keep me logged in
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(47,107,255,0.7)] transition hover:bg-brand-dark disabled:opacity-70"
            >
              {loading ? "Please wait…" : "Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-muted">
          © {new Date().getFullYear()} YourBrand. All rights reserved.
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  right,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-navy">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-muted transition focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-light">
        {icon}
        {children}
        {right}
      </div>
    </div>
  );
}