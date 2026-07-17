import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/components/site/language";
import { WhatsAppFab, MobileTabBar } from "@/components/site/SiteLayout";
import { AuthProvider } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Krishna Computer Center — Empowering Students Through Digital Education" },
      { name: "description", content: "Government-certified computer education institute since 2014. 20+ job-oriented courses including ADCA, DCA, PGDCA, CCC, O Level, Python, Java, Tally & Digital Marketing across 2 branches in Delhi NCR." },
      { name: "keywords", content: "Krishna Computer Center, computer institute Karawal Nagar, NIELIT O Level, CCC course, ADCA, DCA, PGDCA, Tally, Python, Java, computer classes Delhi, computer courses Loni Ghaziabad" },
      { name: "author", content: "Krishna Computer Center" },
      { property: "og:site_name", content: "Krishna Computer Center" },
      { property: "og:title", content: "Krishna Computer Center — Empowering Students Through Digital Education" },
      { property: "og:description", content: "Government-certified, career-focused computer education since 2014. Explore 20+ industry-relevant programs across our Karawal Nagar & Loni branches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Krishna Computer Center — Digital Education Institute" },
      { name: "twitter:description", content: "Government-certified computer courses since 2014. ADCA, DCA, PGDCA, CCC, O Level, Python, Java, Tally, Digital Marketing." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Krishna Computer Center",
          slogan: "Empowering Students Through Digital Education",
          url: "https://krishnacomputercenter.com",
          foundingDate: "2014",
          founder: { "@type": "Person", name: "Kukku Sharma" },
          address: [
            {
              "@type": "PostalAddress",
              streetAddress: "H-3, Gali No.35, West Karawal Nagar",
              addressLocality: "North East Delhi",
              postalCode: "110094",
              addressCountry: "IN",
            },
            {
              "@type": "PostalAddress",
              streetAddress: "G-2851, Rana Chowk, Rampark Extension, Loni",
              addressLocality: "Ghaziabad",
              addressRegion: "UP",
              postalCode: "201102",
              addressCountry: "IN",
            },
          ],
          telephone: ["+91-9289400281", "+91-9911193913", "+91-9289400286"],
          email: "krishnacomputercenter.nielit@gmail.com",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <div className="pb-16 xl:pb-0">
            <Outlet />
          </div>
          <WhatsAppFab />
          <MobileTabBar />
          <Toaster position="top-right" richColors closeButton />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
