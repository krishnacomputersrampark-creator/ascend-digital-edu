import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { claimSuperAdmin } from "@/lib/admissions.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "ERP Setup · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: SetupPage,
});

function SetupPage() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const claim = useServerFn(claimSuperAdmin);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: "/setup" } as any });
  }, [loading, user, nav]);

  const isAlreadyElevated = role && role !== "guest" && role !== "student";

  return (
    <div className="min-h-screen grid place-items-center bg-cyan-soft/40 px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-8 shadow-brand">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-white shadow-brand">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">One-Time ERP Setup</h1>
            <p className="text-sm text-muted-foreground">Claim the first Super Admin account.</p>
          </div>
        </div>
        <p className="rounded-xl bg-cyan-soft/60 p-4 text-sm text-ink/80">
          This page can only be used <b>once</b>. The first authenticated user to visit here will be promoted to <b>Super Admin</b> with full ERP access. All subsequent users must be assigned roles by an existing admin.
        </p>

        <div className="mt-5 rounded-xl border border-border p-4 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Signed in as</div>
          <div className="font-bold text-ink">{user?.email ?? "…"}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Current role: {role ?? "loading"}</div>
        </div>

        {err && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{err}</span>
          </div>
        )}

        {done ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> You are now Super Admin. Reload your dashboard.
            </div>
            <button onClick={() => window.location.replace("/dashboard")} className="inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            disabled={busy || !user || !!isAlreadyElevated}
            onClick={async () => {
              setBusy(true); setErr(null);
              try { await claim(); setDone(true); }
              catch (e: any) { setErr(e?.message ?? "Failed"); }
              finally { setBusy(false); }
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
          >
            {isAlreadyElevated ? "You already have an elevated role" : busy ? "Claiming…" : <>Claim Super Admin <ArrowRight className="h-4 w-4" /></>}
          </button>
        )}

        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-brand">← Back to home</Link>
      </div>
    </div>
  );
}