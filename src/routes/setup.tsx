import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { setupAvailable, bootstrapSuperAdmin } from "@/lib/setup.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "ERP Setup · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: SetupPage,
});

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(120),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Minimum 8 characters").max(72),
    confirm_password: z.string(),
    institute_name: z.string().trim().min(2, "Enter the institute name").max(160),
    branch: z.string().trim().min(2, "Enter the branch name").max(120),
    phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number"),
  })
  .refine((v) => v.password === v.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });

type Form = z.infer<typeof schema>;

function SetupPage() {
  const check = useServerFn(setupAvailable);
  const bootstrap = useServerFn(bootstrapSuperAdmin);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "", email: "", password: "", confirm_password: "",
      institute_name: "Krishna Computer Center", branch: "Main Branch", phone: "",
    },
  });

  useEffect(() => {
    let alive = true;
    setCheckError(null);
    check({} as any)
      .then((r: any) => { if (alive) setAvailable(!!r?.available); })
      .catch((e: any) => {
        // A failed check must NEVER be reported as "setup already completed".
        if (alive) { setCheckError(e?.message ?? "Could not check setup status"); setAvailable(null); }
      });
    return () => { alive = false; };
  }, [check]);

  const onSubmit = async (v: Form) => {
    setErr(null);
    try {
      await bootstrap({ data: v } as any);
      setDone(true);
      toast.success("Super Admin created. You can sign in now.");
    } catch (e: any) {
      const msg = e?.message ?? "Setup failed";
      setErr(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-cyan-soft/40 px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-white p-8 shadow-brand">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-white shadow-brand">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">One-Time ERP Setup</h1>
            <p className="text-sm text-muted-foreground">Create the first Super Admin account.</p>
          </div>
        </div>

        {available === null && !checkError && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking setup status…
          </div>
        )}

        {checkError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Could not check setup status: {checkError}. Reload the page to try again.</span>
          </div>
        )}

        {available === false && !done && !checkError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-cyan-soft/50 p-4 text-sm text-ink/80">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              Setup has already been completed and this page is permanently disabled. Ask an existing Super Admin to create
              your account, or <Link to="/auth" className="font-semibold text-brand underline">sign in</Link>.
            </span>
          </div>
        )}

        {done && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Super Admin created successfully. This page is now disabled.
            </div>
            <Link to="/auth" className="inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand">
              Go to Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {available === true && !done && (
          <>
            <p className="rounded-xl bg-cyan-soft/60 p-4 text-sm text-ink/80">
              This page can only be used <b>once</b>. The account created here becomes the <b>Super Admin</b> with full ERP
              access. Afterwards the page is permanently disabled and all other users must be approved by an administrator.
            </p>

            {err && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{err}</span>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2">
              <F label="Full Name" error={form.formState.errors.full_name?.message} className="sm:col-span-2">
                <input className={inp} placeholder="e.g. Rahul Sharma" {...form.register("full_name")} />
              </F>
              <F label="Email" error={form.formState.errors.email?.message}>
                <input type="email" autoComplete="email" className={inp} placeholder="admin@example.com" {...form.register("email")} />
              </F>
              <F label="Phone Number" error={form.formState.errors.phone?.message}>
                <input type="tel" className={inp} placeholder="10-digit mobile" {...form.register("phone")} />
              </F>
              <F label="Password" error={form.formState.errors.password?.message}>
                <input type="password" autoComplete="new-password" className={inp} placeholder="Minimum 8 characters" {...form.register("password")} />
              </F>
              <F label="Confirm Password" error={form.formState.errors.confirm_password?.message}>
                <input type="password" autoComplete="new-password" className={inp} placeholder="Re-enter password" {...form.register("confirm_password")} />
              </F>
              <F label="Institute Name" error={form.formState.errors.institute_name?.message}>
                <input className={inp} {...form.register("institute_name")} />
              </F>
              <F label="Branch" error={form.formState.errors.branch?.message}>
                <input className={inp} placeholder="e.g. Main Branch" {...form.register("branch")} />
              </F>
              <button
                disabled={form.formState.isSubmitting}
                className="sm:col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
              >
                {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Super Admin <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          </>
        )}

        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-brand">← Back to home</Link>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";

function F({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}
