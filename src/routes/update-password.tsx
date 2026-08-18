import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/update-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a New Password · Krishna Computer Center" },
      { name: "description", content: "Create a new password for your Krishna Computer Center ERP account using your secure recovery link." },
      { property: "og:title", content: "Set a New Password · Krishna Computer Center" },
      { property: "og:description", content: "Create a new password for your Krishna Computer Center ERP account using your secure recovery link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UpdatePasswordPage,
});

const schema = z.object({
  password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Add an uppercase letter").regex(/[0-9]/, "Add a number"),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
type Form = z.infer<typeof schema>;

type Phase = "checking" | "ready" | "invalid" | "done";

function readHashError() {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const q = new URLSearchParams(raw || window.location.search);
  const code = q.get("error_code");
  const desc = q.get("error_description");
  if (!code && !q.get("error")) return null;
  if (code === "otp_expired") return "This password reset link has expired. Reset links are valid for a short time and can only be used once — please request a new one.";
  return desc?.replace(/\+/g, " ") ?? "This password reset link is invalid.";
}

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [problem, setProblem] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let active = true;

    const err = readHashError();
    if (err) { setProblem(err); setPhase("invalid"); return; }

    // The Supabase client parses the recovery tokens from the URL on load.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (session && event !== "SIGNED_OUT")) setPhase("ready");
    });

    // PKCE style links arrive as ?code=...
    const code = new URLSearchParams(window.location.search).get("code");
    const finish = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) { setProblem("This password reset link is invalid or has already been used. Please request a new one."); setPhase("invalid"); return; }
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) setPhase("ready");
      else {
        setProblem("We could not find a valid password recovery session. Open the link from your email again, or request a new reset email.");
        setPhase("invalid");
      }
    };
    // give the client a tick to consume the URL hash
    const t = setTimeout(() => { void finish(); }, 400);

    return () => { active = false; clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  const onSubmit = async (v: Form) => {
    const { error } = await supabase.auth.updateUser({ password: v.password, data: { must_change_password: false } });
    if (error) { toast.error(error.message); return; }
    setPhase("done");
    toast.success("Password updated successfully");
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/auth" }), 1500);
  };

  return (
    <SiteLayout>
      <section className="relative isolate flex min-h-[90vh] items-center overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 -z-10 gradient-brand-dark opacity-95" />
        <div className="mx-auto w-full max-w-md px-4">
          <div className="glass-card rounded-3xl p-7 shadow-brand">
            <header className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand"><KeyRound className="h-4 w-4" /></span>
              <h1 className="text-base font-bold text-ink">Set a New Password</h1>
            </header>

            {phase === "checking" && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verifying your recovery link…</p>
            )}

            {phase === "invalid" && (
              <div className="space-y-4">
                <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> <span>{problem}</span>
                </div>
                <Link to="/auth" className="inline-flex w-full items-center justify-center rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand">
                  Back to Sign In
                </Link>
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  Your password has been updated. Redirecting you to the sign-in page…
                </div>
                <Link to="/auth" className="inline-flex w-full items-center justify-center rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand">
                  Sign In Now
                </Link>
              </div>
            )}

            {phase === "ready" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-ink/80">New Password</span>
                  <div className="relative mt-1">
                    <input type={show ? "text" : "password"} autoComplete="new-password" {...register("password")}
                      className="w-full rounded-xl border bg-white/80 px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                    <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.password.message}</span>}
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-ink/80">Confirm New Password</span>
                  <input type={show ? "text" : "password"} autoComplete="new-password" {...register("confirm")}
                    className="mt-1 w-full rounded-xl border bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                  {errors.confirm && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.confirm.message}</span>}
                </label>
                <button disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
