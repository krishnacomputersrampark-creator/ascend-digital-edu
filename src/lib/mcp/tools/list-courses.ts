import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description: "List the institute's courses with code, duration, fees and category.",
  inputSchema: {
    search: z.string().optional().describe("Optional text to match against course name or code."),
    limit: z.number().int().optional().describe("Maximum number of courses to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    const take = Math.min(Math.max(limit ?? 25, 1), 100);
    let query = supabaseForUser(ctx)
      .from("courses")
      .select("code, name, category, duration, fees, is_active")
      .eq("is_active", true)
      .order("sort_order")
      .limit(take);
    if (search?.trim()) query = query.or(`name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%`);
    const { data, error } = await query;
    return error ? failure(error.message) : text(data ?? []);
  },
});
