import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/downloads")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const rs = new Set((roles ?? []).map((r) => r.role));
    if (rs.has("super_admin") || rs.has("admin") || rs.has("branch_manager")) throw redirect({ to: "/admin/downloads" });
    if (rs.has("faculty")) throw redirect({ to: "/faculty/downloads" });
    throw redirect({ to: "/student-dashboard/downloads" });
  },
  component: () => null,
});