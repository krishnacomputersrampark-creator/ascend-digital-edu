import { defineTool } from "@lovable.dev/mcp-js";
import { failure, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description: "Return the signed-in user's profile, role, and linked student record (if any).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [{ data: profile }, { data: role }, { data: student }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone").eq("id", userId!).maybeSingle(),
      supabase.rpc("get_current_user_role"),
      supabase.from("students").select("enrollment_no, student_code, full_name, status").eq("user_id", userId!).maybeSingle(),
    ]);
    return text({ user_id: userId, email: ctx.getUserEmail(), role, profile, student });
  },
});
