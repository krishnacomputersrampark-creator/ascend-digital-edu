import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ShieldCheck, ArrowRight, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In · Krishna Computer Center ERP" },
      { name: "description", content: "Secure sign-in for students, faculty, and administrators of Krishna Computer Center." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone").optional().or(z.literal("")),
  password: z.string().min(6, "Minimum 6 characters").max(72),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const signIn = useForm<SignInForm>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const signUp = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema), defaultValues: { full_name: "", email: "", phone: "", password: "" } });

  const onSignIn = async (v: SignInForm) => {
    const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const onSignUp = async (v: SignUpForm) => {
    const { error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: v.full_name, phone: v.phone ?? "" },
      },
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Account created. You can sign in now.");
    setMode("signin");
    signIn.reset({ email: v.email, password: "" });
  };

  const isSignIn = mode === "signin";
  const busy = isSignIn ? signIn.formState.isSubmitting : signUp.formState.isSubmitting;

  return (
    <SiteLayout>
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 -z-10 gradient-brand-dark opacity-95" />
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan/30 blur-3xl animate-blob" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-white/20 blur-3xl animate-blob" />
        </div>
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Institute ERP · Secure Access
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
              {isSignIn ? (<>Welcome back to <br /><span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Krishna ERP</span></>) : (<>Create your <br /><span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Krishna ERP</span> account</>)}
            </h1>
            <p className="mt-4 max-w-md text-white/85">
              One secure portal for students, faculty, branch managers, and administrators. Attendance, results, fees, certificates, admissions — all in one place.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/85">
              {[
                "Role-based dashboards for six user types",
                "Encrypted sessions with automatic refresh",
                "Attendance, results, fees & certificates on demand",
                "Multi-branch data isolation with RLS",
              ].map((l) => (
                <li key={l} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-soft" /> {l}</li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="glass-card rounded-3xl p-7 shadow-brand">
              <div className="mb-5 inline-flex w-full rounded-full bg-cyan-soft p-1 text-xs font-semibold">
                <button type="button" onClick={() => setMode("signin")} className={`flex-1 rounded-full px-3 py-1.5 transition ${isSignIn ? "gradient-brand text-white shadow-brand" : "text-ink/70"}`}>Sign In</button>
                <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-full px-3 py-1.5 transition ${!isSignIn ? "gradient-brand text-white shadow-brand" : "text-ink/70"}`}>Create Account</button>
              </div>

              {isSignIn ? (
                <form onSubmit={signIn.handleSubmit(onSignIn)} className="space-y-4">
                  <Field label="Email" icon={<Mail className="h-4 w-4 text-brand" />} error={signIn.formState.errors.email?.message}>
                    <input type="email" autoComplete="email" placeholder="you@example.com" className="w-full bg-transparent text-sm focus:outline-none" {...signIn.register("email")} />
                  </Field>
                  <Field label="Password" icon={<Lock className="h-4 w-4 text-brand" />} error={signIn.formState.errors.password?.message}
                    trailing={
                      <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted-foreground hover:text-brand" aria-label="Toggle password">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  >
                    <input type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="w-full bg-transparent text-sm focus:outline-none" {...signIn.register("password")} />
                  </Field>
                  <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5 disabled:opacity-70">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="font-semibold text-brand hover:underline">Create one</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={signUp.handleSubmit(onSignUp)} className="space-y-4">
                  <Field label="Full Name" icon={<UserIcon className="h-4 w-4 text-brand" />} error={signUp.formState.errors.full_name?.message}>
                    <input autoComplete="name" placeholder="e.g. Rahul Sharma" className="w-full bg-transparent text-sm focus:outline-none" {...signUp.register("full_name")} />
                  </Field>
                  <Field label="Email" icon={<Mail className="h-4 w-4 text-brand" />} error={signUp.formState.errors.email?.message}>
                    <input type="email" autoComplete="email" placeholder="you@example.com" className="w-full bg-transparent text-sm focus:outline-none" {...signUp.register("email")} />
                  </Field>
                  <Field label="Phone (optional)" icon={<Phone className="h-4 w-4 text-brand" />} error={signUp.formState.errors.phone?.message}>
                    <input type="tel" autoComplete="tel" placeholder="10-digit mobile" className="w-full bg-transparent text-sm focus:outline-none" {...signUp.register("phone")} />
                  </Field>
                  <Field label="Password" icon={<Lock className="h-4 w-4 text-brand" />} error={signUp.formState.errors.password?.message}
                    trailing={
                      <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted-foreground hover:text-brand" aria-label="Toggle password">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  >
                    <input type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Minimum 6 characters" className="w-full bg-transparent text-sm focus:outline-none" {...signUp.register("password")} />
                  </Field>
                  <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5 disabled:opacity-70">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    New users start with the <b>Guest</b> role until an administrator assigns access.
                  </p>
                </form>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-white/80">
              Need admission? <Link to="/admission" className="font-semibold underline decoration-cyan-soft">Apply here</Link>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label, icon, error, trailing, children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      <div className={`mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30 ${error ? "border-red-400" : ""}`}>
        {icon}
        {children}
        {trailing}
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </label>
  );
}