import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "admin"
  | "branch_manager"
  | "faculty"
  | "student"
  | "guest";

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  branch_manager: "Branch Manager",
  faculty: "Faculty",
  student: "Student",
  guest: "Guest",
};

export const ROLE_HOME: Record<AppRole, string> = {
  super_admin: "/dashboard",
  admin: "/dashboard",
  branch_manager: "/dashboard",
  faculty: "/dashboard",
  student: "/dashboard",
  guest: "/dashboard",
};

type AuthState = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: { full_name: string | null; photo_url: string | null; email: string | null } | null;
  loading: boolean;
};

const AuthCtx = createContext<AuthState>({
  session: null,
  user: null,
  role: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadUserContext = async (session: Session | null) => {
      if (!session?.user) {
        if (mounted) setState({ session: null, user: null, role: null, profile: null, loading: false });
        return;
      }
      // Fetch role + profile in parallel via setTimeout to avoid deadlocks with onAuthStateChange
      setTimeout(async () => {
        const [{ data: roleRow }, { data: prof }] = await Promise.all([
          supabase.rpc("get_current_user_role"),
          supabase.from("profiles").select("full_name, photo_url, email").eq("id", session.user.id).maybeSingle(),
        ]);
        if (!mounted) return;
        setState({
          session,
          user: session.user,
          role: (roleRow as AppRole | null) ?? "guest",
          profile: prof ?? null,
          loading: false,
        });
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "INITIAL_SESSION") return;
      loadUserContext(session);
    });

    supabase.auth.getSession().then(({ data }) => loadUserContext(data.session));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

export async function signOutAndRedirect() {
  await supabase.auth.signOut();
  window.location.replace("/");
}