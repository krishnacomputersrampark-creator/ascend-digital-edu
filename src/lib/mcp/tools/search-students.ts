import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "search_students",
  title: "Search students",
  description: "Search students visible to the signed-in user by name, enrollment number, or phone.",
  inputSchema: {
    query: z.string().describe("Name, enrollment number, student code, or phone to search for."),
    limit: z.number().int().optional().describe("Maximum number of students to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    const q = query.trim();
    if (!q) return failure("Provide a search query.");
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    const { data, error } = await supabaseForUser(ctx)
      .from("students")
      .select("enrollment_no, student_code, full_name, phone, email, status, joined_at")
      .is("deleted_at", null)
      .or(`full_name.ilike.%${q}%,enrollment_no.ilike.%${q}%,student_code.ilike.%${q}%,phone.ilike.%${q}%`)
      .order("joined_at", { ascending: false })
      .limit(take);
    return error ? failure(error.message) : text(data ?? []);
  },
});
