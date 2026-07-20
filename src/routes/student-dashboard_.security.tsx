import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/student/PortalShell";

export const Route = createFileRoute("/student-dashboard_/security")({
  head: () => ({ meta: [{ title: "Account Security · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
});

const schema = z.object({
  current: z.string().min(1, "Enter current password"),
  next: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Add an uppercase letter").regex(/[0-9]/, "Add a number"),
  confirm: z.string(),
}).refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
type FormValues = z.infer<typeof schema>;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return Math.min(s, 4);
}
const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

function SecurityPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("Student");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const nextPw = watch("next", "");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/login", search: { redirect: "/student-dashboard/security" } }); return; }
      setEmail(data.session.user.email ?? null);
      setName(data.session.user.user_metadata?.full_name ?? data.session.user.email?.split("@")[0] ?? "Student");
    });
  }, [navigate]);

  const onSubmit = async (v: FormValues) => {
    if (!email) return;
    setBusy(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: v.current });
      if (signInErr) { toast.error("Current password is incorrect"); setBusy(false); return; }
      const { error } = await supabase.auth.updateUser({ password: v.next });
      if (error) throw error;
      toast.success("Password updated");
      reset();
    } catch (e: any) { toast.error(e?.message ?? "Update failed"); }
    finally { setBusy(false); }
  };

  const onForgot = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (error) toast.error(error.message); else toast.success("Password reset link sent");
  };

  const initials = name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  const s = strength(nextPw);

  return (
    <PortalShell name={name} initials={initials} subline={email ?? undefined}>
      <section className="px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Account Security</h1>
          <p className="text-sm text-muted-foreground">Manage your password and review recent activity.</p>
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-soft">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand"><KeyRound className="h-4 w-4" /></span>
            <h2 className="text-base font-bold text-ink">Change Password</h2>
          </header>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 block">
              <span className="text-xs font-semibold text-ink/80">Current Password</span>
              <div className="relative mt-1">
                <input type={show1 ? "text" : "password"} {...register("current")}
                  className="w-full rounded-xl border bg-white/80 px-3 py-2 pr-10 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                <button type="button" onClick={() => setShow1(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.current && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.current.message}</span>}
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink/80">New Password</span>
              <div className="relative mt-1">
                <input type={show2 ? "text" : "password"} {...register("next")}
                  className="w-full rounded-xl border bg-white/80 px-3 py-2 pr-10 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                <button type="button" onClick={() => setShow2(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.next && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.next.message}</span>}
              {nextPw && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= s-1 ? COLORS[s] : "bg-muted"}`} />)}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{LABELS[s]}</div>
                </div>
              )}
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink/80">Confirm New Password</span>
              <input type={show2 ? "text" : "password"} {...register("confirm")}
                className="mt-1 w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              {errors.confirm && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.confirm.message}</span>}
            </label>
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <button type="button" onClick={onForgot} className="text-xs font-semibold text-brand hover:underline">Forgot password?</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-brand disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Update Password
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-soft">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand"><History className="h-4 w-4" /></span>
            <h2 className="text-base font-bold text-ink">Login History</h2>
          </header>
          <div className="rounded-xl border border-dashed bg-cyan-soft/20 p-8 text-center">
            <p className="text-sm font-semibold text-ink">Coming soon</p>
            <p className="mt-1 text-xs text-muted-foreground">Recent sign-ins, device & IP details will appear here.</p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/student-dashboard" className="text-sm font-semibold text-brand hover:underline">← Back to Dashboard</Link>
        </div>
      </section>
    </PortalShell>
  );
}