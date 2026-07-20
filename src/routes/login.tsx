import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User as UserIcon, ShieldCheck, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Login · Krishna Computer Center" },
      { name: "description", content: "Secure student login using Student ID or registered email." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  component: LoginPage,
});

const schema = z.object({
  identifier: z.string().trim().min(3, "Enter your Student ID or email"),
  password: z.string().min(6, "Minimum 6 characters"),
  remember: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { identifier: "", password: "", remember: true } });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/student-dashboard" });
    });
  }, [navigate, redirect]);

  const onSubmit = async (v: Form) => {
    let email = v.identifier;
    if (!email.includes("@")) {
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("student_id", v.identifier.trim())
        .maybeSingle();
      if (error || !data?.email) {
        toast.error("No student found with that ID");
        return;
      }
      email = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: v.password });
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in successfully");
    navigate({ to: redirect ?? "/student-dashboard" });
  };

  const busy = form.formState.isSubmitting;

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
              <GraduationCap className="h-3.5 w-3.5" /> Student Portal · Secure Login
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
              Welcome to your <br />
              <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Student Zone</span>
            </h1>
            <p className="mt-4 max-w-md text-white/85">
              Sign in with your Student ID or registered email to access attendance, results, fees, certificates, downloads and online tests.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/85">
              {[
                "Encrypted sessions with auto-refresh",
                "Access your attendance, results & fees anytime",
                "Download certificates and study material",
                "Take upcoming online tests from anywhere",
              ].map((l) => (
                <li key={l} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-soft" /> {l}</li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="glass-card rounded-3xl p-7 shadow-brand">
              <h2 className="text-lg font-bold text-ink">Student Login</h2>
              <p className="mt-1 text-xs text-muted-foreground">Use your Student ID or registered email address.</p>

              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
                <Field label="Student ID or Email" icon={<UserIcon className="h-4 w-4 text-brand" />} error={form.formState.errors.identifier?.message}>
                  <input autoComplete="username" placeholder="KCC2024/00123 or you@example.com" className="w-full bg-transparent text-sm focus:outline-none" {...form.register("identifier")} />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4 text-brand" />} error={form.formState.errors.password?.message}
                  trailing={
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="text-muted-foreground hover:text-brand" aria-label="Toggle password">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                >
                  <input type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="Your password" className="w-full bg-transparent text-sm focus:outline-none" {...form.register("password")} />
                </Field>

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-ink/80">
                    <input type="checkbox" className="h-4 w-4 rounded border-cyan text-brand focus:ring-brand" {...form.register("remember")} />
                    Remember me
                  </label>
                  <Link to="/auth" className="font-semibold text-brand hover:underline">Forgot password?</Link>
                </div>

                <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5 disabled:opacity-70">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  New student?{" "}
                  <Link to="/auth" className="font-semibold text-brand hover:underline">Create an account</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, icon, trailing, error, children }: { label: string; icon: React.ReactNode; trailing?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink/80">{label}</span>
      <span className="flex items-center gap-2 rounded-xl border bg-white/80 px-3 py-2.5 backdrop-blur focus-within:border-brand">
        {icon}
        {children}
        {trailing}
      </span>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}