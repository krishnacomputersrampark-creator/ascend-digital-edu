import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "verify_certificate",
  title: "Verify certificate",
  description: "Check whether a Krishna Computer Center certificate number is valid, issued, or revoked.",
  inputSchema: { certificate_number: z.string().describe("Certificate number, e.g. KCC-CERT-2025-000123.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ certificate_number }, ctx) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("certificates")
      .select("certificate_number, certificate_type, issue_date, completion_date, grade, percentage, status, revoked_reason")
      .eq("certificate_number", certificate_number.trim())
      .maybeSingle();
    if (error) return failure(error.message);
    if (!data) return text({ valid: false, message: "No certificate found with that number." });
    return text({ valid: data.status === "issued", certificate: data });
  },
});
