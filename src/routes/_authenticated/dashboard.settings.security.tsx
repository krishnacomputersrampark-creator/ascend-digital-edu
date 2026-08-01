import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/settings/security")({
  head: () => ({
    meta: [
      { title: "Security · Krishna Computer Center ERP" },
      { name: "description", content: "Change your ERP account password and keep your administrator access secure." },
      { property: "og:title", content: "Security · Krishna Computer Center ERP" },
      { property: "og:description", content: "Change your ERP account password and keep your administrator access secure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SecuritySettingsPage,
});

const schema = z.object({
  current: z.string().min(1, "Enter your current password"),
  next: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Add an uppercase letter").regex(/[0-9]/, "Add a number"),
  confirm: z.string(),
}).refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
type Form = z.infer<typeof schema>;

function SecuritySettingsPage() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    const email = user?.email;
    if (!email) { toast.error("No active session"); return; }
    setBusy(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: v.current });
      if (signInErr) { toast.error("Current password is incorrect"); return; }
      const { error } = await supabase.auth.updateUser({
        password: v.next,
        data: { must_change_password: false },
      });
      if (error) throw error;
      toast.success("Password updated. The security notice has been dismissed.");
      reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update the password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell title="Security" subtitle="Change your account password">
      <div className="glass-card max-w-xl rounded-3xl p-6 shadow-soft">
        <header className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand"><KeyRound className="h-4 w-4" /></span>
          <h2 className="text-base font-bold text-ink">Change Password</h2>
        </header>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-ink/80">Current Password</span>
            <input type="password" autoComplete="current-password" {...register("current")}
              className="mt-1 w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            {errors.current && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.current.message}</span>}
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/80">New Password</span>
            <div className="relative mt-1">
              <input type={show ? "text" : "password"} autoComplete="new-password" {...register("next")}
                className="w-full rounded-xl border bg-white/80 px-3 py-2 pr-10 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle password" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.next && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.next.message}</span>}
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/80">Confirm New Password</span>
            <input type={show ? "text" : "password"} autoComplete="new-password" {...register("confirm")}
              className="mt-1 w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            {errors.confirm && <span className="mt-1 block text-[11px] font-semibold text-red-600">{errors.confirm.message}</span>}
          </label>
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard/settings" className="text-xs font-semibold text-brand hover:underline">← Back to Settings</Link>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-brand disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Update Password
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
