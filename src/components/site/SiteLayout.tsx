import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  GraduationCap,
  Menu,
  X,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Linkedin,
  Home,
  Users,
  Download,
  BookOpen,
  Bell,
  MessageCircle,
  Languages,
  Sparkles,
} from "lucide-react";
import logoAsset from "@/assets/logo.jpg.asset.json";
import { useLang } from "./language";
import { useAuth, signOutAndRedirect, ROLE_LABEL } from "@/lib/auth";
import { LayoutDashboard, LogOut } from "lucide-react";

const NAV = [
  { label: "Home", hi: "होम", to: "/" },
  { label: "About", hi: "परिचय", to: "/", hash: "#about" },
  { label: "Courses", hi: "कोर्स", to: "/courses" },
  { label: "Student Zone", hi: "स्टूडेंट ज़ोन", to: "/student-zone" },
  { label: "Downloads", hi: "डाउनलोड", to: "/downloads" },
  { label: "Gallery", hi: "गैलरी", to: "/gallery" },
  { label: "Notices", hi: "सूचना", to: "/notice" },
  { label: "Events", hi: "इवेंट्स", to: "/events" },
  { label: "Contact", hi: "संपर्क", to: "/contact" },
];

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5 ${compact ? "" : "shadow-soft"}`}>
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lang === "en" ? "gradient-brand text-white" : "text-ink/70"}`}
        aria-label="Switch to English"
      >EN</button>
      <button
        onClick={() => setLang("hi")}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lang === "hi" ? "gradient-brand text-white" : "text-ink/70"}`}
        aria-label="हिंदी में देखें"
      >हिं</button>
    </div>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { lang, t } = useLang();
  const { user, role, profile } = useAuth();
  const signedIn = !!user;
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? "border-border/60 bg-white/95 shadow-soft backdrop-blur-lg" : "border-transparent bg-white/90 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoAsset.url}
            alt="Krishna Computer Center logo"
            width={44}
            height={44}
            className="h-10 w-10 rounded-xl bg-white object-contain shadow-soft ring-1 ring-border sm:h-11 sm:w-11"
          />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[13px] font-extrabold tracking-tight text-brand-dark md:text-sm">
              KRISHNA COMPUTER CENTER
            </span>
            <span className="text-[10px] text-muted-foreground md:text-[11px]">
              {t("Empowering Students Through Digital Education", "डिजिटल शिक्षा के माध्यम से छात्रों को सशक्त बनाना")}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              hash={n.hash}
              className="rounded-full px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-cyan-soft hover:text-brand"
              activeOptions={{ exact: true }}
              activeProps={{ className: "rounded-full px-3 py-2 text-sm font-semibold text-brand bg-cyan-soft" }}
            >
              {lang === "hi" ? n.hi : n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {signedIn ? (
            <>
              <Link
                to="/dashboard"
                className="hidden items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand transition hover:opacity-95 lg:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" /> {t("Dashboard", "डैशबोर्ड")}
              </Link>
              <button
                onClick={() => void signOutAndRedirect()}
                title={`${displayName}${role ? " · " + ROLE_LABEL[role] : ""}`}
                className="hidden rounded-full border border-border bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:text-brand lg:inline-flex"
              >
                <LogOut className="mr-1.5 inline h-4 w-4" />{t("Sign out", "साइन आउट")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-ink hover:text-brand lg:inline-flex"
              >{t("Login", "लॉगिन")}</Link>
              <Link
                to="/admission"
                className="hidden items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand transition hover:opacity-95 lg:inline-flex"
              >{t("Apply Now", "अभी आवेदन")} <ArrowRight className="h-4 w-4" /></Link>
            </>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-soft text-brand xl:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-white shadow-soft xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-1 px-4 py-4">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                hash={n.hash}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-cyan-soft hover:text-brand"
              >
                {lang === "hi" ? n.hi : n.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-3">
              {signedIn ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-full gradient-brand px-4 py-2 text-center text-sm font-semibold text-white">
                    {t("Open Dashboard", "डैशबोर्ड खोलें")}
                  </Link>
                  <button onClick={() => { setOpen(false); void signOutAndRedirect(); }} className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold">
                    {t("Sign out", "साइन आउट")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold">
                    {t("Sign In", "साइन इन")}
                  </Link>
                  <Link to="/admission" onClick={() => setOpen(false)} className="rounded-full gradient-brand px-4 py-2 text-center text-sm font-semibold text-white">
                    {t("Apply Now", "अभी आवेदन")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink pt-16 pb-8 text-white/85">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-cyan/30 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logoAsset.url} alt="Krishna Computer Center" width={44} height={44} className="h-11 w-11 rounded-xl bg-white object-contain p-1" />
              <div>
                <div className="text-sm font-bold text-white">KRISHNA COMPUTER CENTER</div>
                <div className="text-[11px] text-white/60">Empowering Students Through Digital Education</div>
              </div>
            </div>
            <p className="mt-5 text-sm text-white/70">
              Government-certified computer education institute serving Delhi NCR since 2014. Practical, career-ready programs across two branches.
            </p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Youtube, Send, Linkedin].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:-translate-y-0.5 hover:bg-brand hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Explore</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { l: "Courses", to: "/courses" },
                { l: "Student Zone", to: "/student-zone" },
                { l: "Admission", to: "/admission" },
                { l: "Downloads", to: "/downloads" },
                { l: "Gallery", to: "/gallery" },
                { l: "Notice Board", to: "/notice" },
                { l: "Events", to: "/events" },
                { l: "FAQ", to: "/faq" },
              ].map((x) => (
                <li key={x.l}><Link to={x.to} className="hover:text-cyan">{x.l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Verify & Search</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/verify-certificate" className="hover:text-cyan">Verify Certificate</Link></li>
              <li><Link to="/search/student" className="hover:text-cyan">Search Student</Link></li>
              <li><Link to="/search/result" className="hover:text-cyan">Search Result</Link></li>
              <li><Link to="/search/certificate" className="hover:text-cyan">Search Certificate</Link></li>
              <li><Link to="/faculty" className="hover:text-cyan">Faculty</Link></li>
              <li><Link to="/franchise" className="hover:text-cyan">Franchise</Link></li>
              <li><Link to="/testimonials" className="hover:text-cyan">Testimonials</Link></li>
              <li><Link to="/blog" className="hover:text-cyan">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Reach Us</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> Karawal Nagar: H-3, Gali 35, West Karawal Nagar, Delhi 110094</li>
              <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> Loni: G-2851, Rana Chowk, Rampark Ext., Ghaziabad 201102</li>
              <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> +91 9289400281 · 9911193913 · 9289400286</li>
              <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> krishnacomputercenter.nielit@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Krishna Computer Center. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/faq" className="hover:text-white">FAQ</Link>
            <a href="#privacy" className="hover:text-white">Privacy</a>
            <a href="#terms" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/919911193913?text=Hello%20Krishna%20Computer%20Center%2C%20I%20need%20help."
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-20 right-4 z-40 flex items-center gap-3 rounded-full bg-emerald-500 py-3 pl-3 pr-4 text-white shadow-brand transition hover:-translate-y-0.5 hover:bg-emerald-600 sm:bottom-6 sm:right-6"
      aria-label="Chat on WhatsApp"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur">
        <MessageCircle className="h-5 w-5" />
      </span>
      <span className="hidden text-sm leading-tight sm:block">
        <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-80">Need Help?</span>
        <span className="block font-bold">Chat with us</span>
      </span>
      <span className="absolute right-2 top-2 inline-flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
    </a>
  );
}

export function MobileTabBar() {
  const items = [
    { icon: Home, label: "Home", to: "/" },
    { icon: BookOpen, label: "Courses", to: "/courses" },
    { icon: Users, label: "Student", to: "/student-zone" },
    { icon: Download, label: "Downloads", to: "/downloads" },
    { icon: Bell, label: "Notice", to: "/notice" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white/95 backdrop-blur-lg shadow-[0_-8px_20px_-15px_rgba(8,66,152,0.25)] xl:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ icon: Icon, label, to }) => (
          <li key={label}>
            <Link
              to={to}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-ink/70"
              activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-brand" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden gradient-brand-dark pt-32 pb-16 text-white sm:pt-36 sm:pb-20">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan/30 blur-3xl animate-blob" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-white/20 blur-3xl animate-blob" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_45%)]" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </span>
        )}
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{subtitle}</p>}
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        {children}
      </div>
    </section>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}