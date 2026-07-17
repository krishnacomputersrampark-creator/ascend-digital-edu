import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});

function randomCaptcha() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function LoginPage() {
  const nav = useNavigate();
  const [method, setMethod] = useState<"id" | "email" | "mobile">("id");
  const [show, setShow] = useState(false);
  const [captcha, setCaptcha] = useState(() => randomCaptcha());
  const [entered, setEntered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const placeholder = useMemo(
    () => ({ id: "e.g. KCC2024/00123", email: "you@example.com", mobile: "10-digit mobile number" })[method],
    [method],
  );
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
              <ShieldCheck className="h-3.5 w-3.5" /> Encrypted & Secure
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
              Welcome back, <br />
              <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">learner.</span>
            </h1>
            <p className="mt-4 max-w-md text-white/85">
              Sign in with your Student ID, email or mobile number to access dashboard, attendance, results, and certificates.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/85">
              {["Secure login with encrypted sessions", "Remember me option for trusted devices", "Captcha protection against bots", "Password reset via registered email"].map((l) => (
                <li key={l} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-soft" /> {l}</li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = (e.currentTarget.elements.namedItem("cap") as HTMLInputElement).value.trim().toUpperCase();
                if (val !== captcha) { setError("Captcha does not match. Try again."); return; }
                setError(null);
                nav({ to: "/student/dashboard" });
              }}
              className="glass-card space-y-5 rounded-3xl p-7 shadow-brand"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-ink">Student Login</h2>
                <p className="mt-1 text-sm text-muted-foreground">Access your personalized portal.</p>
              </div>
              <div className="inline-flex w-full rounded-full bg-cyan-soft p-1 text-xs font-semibold">
                {(["id", "email", "mobile"] as const).map((m) => (
                  <button
                    key={m} type="button" onClick={() => setMethod(m)}
                    className={`flex-1 rounded-full px-3 py-1.5 transition ${method === m ? "gradient-brand text-white shadow-brand" : "text-ink/70"}`}
                  >
                    {m === "id" ? "Student ID" : m === "email" ? "Email" : "Mobile"}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                  {method === "id" ? "Student ID" : method === "email" ? "Email" : "Mobile Number"}
                </span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
                  <User className="h-4 w-4 text-brand" />
                  <input required type={method === "email" ? "email" : "text"} inputMode={method === "mobile" ? "tel" : "text"} placeholder={placeholder} className="w-full bg-transparent text-sm focus:outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Password</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
                  <Lock className="h-4 w-4 text-brand" />
                  <input required type={show ? "text" : "password"} placeholder="Enter your password" className="w-full bg-transparent text-sm focus:outline-none" />
                  <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-brand" aria-label="Toggle password visibility">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-ink/80">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[color:var(--brand)]" />
                  Remember me
                </label>
                <a href="#forgot" className="font-semibold text-brand hover:underline">Forgot password?</a>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Captcha</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="select-none rounded-xl border bg-[repeating-linear-gradient(45deg,rgba(13,110,253,0.08)_0_6px,transparent_6px_12px)] px-4 py-2 font-mono text-base font-bold tracking-[0.3em] text-brand-dark line-through decoration-2">
                    {captcha}
                  </div>
                  <button type="button" onClick={() => setCaptcha(randomCaptcha())} className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-soft text-brand" aria-label="Refresh captcha">
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                  <input name="cap" required placeholder="Type code" value={entered} onChange={(e) => setEntered(e.target.value)} className="flex-1 rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5">
                Sign In <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-xs text-muted-foreground">
                New here? <Link to="/admission" className="font-semibold text-brand hover:underline">Apply for admission</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}