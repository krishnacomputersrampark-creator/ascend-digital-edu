import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "hi";
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (en: string, hi?: string) => string };
const LanguageCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (en) => en });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("kcc-lang")) as Lang | null;
    if (stored === "en" || stored === "hi") setLang(stored);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("kcc-lang", lang);
  }, [lang]);
  const t = (en: string, hi?: string) => (lang === "hi" && hi ? hi : en);
  return <LanguageCtx.Provider value={{ lang, setLang, t }}>{children}</LanguageCtx.Provider>;
}

export function useLang() {
  return useContext(LanguageCtx);
}