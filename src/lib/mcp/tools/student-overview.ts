import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failure, supabaseForUser, text } from "../supabase";

export default defineTool({
  name: "student_overview",
  title: "Student overview",
  description: "Fee balance, attendance summary, published results and certificates for one student, by enrollment number.",
  inputSchema: { enrollment_no: z.string().describe("The student's enrollment number, e.g. KCC/2025/00123.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ enrollment_no }, ctx) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data: student, error } = await supabase
      .from("students")
      .select("id, enrollment_no, full_name, status, joined_at")
      .eq("enrollment_no", enrollment_no.trim())
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return failure(error.message);
    if (!student) return failure(`No visible student found for enrollment number ${enrollment_no}.`);

    const [fees, attendance, results, certificates] = await Promise.all([
      supabase.from("student_fees").select("total_fee, discount_amount, final_fee, paid_amount, due_amount, payment_status").eq("student_id", student.id),
      supabase.from("attendance").select("status").eq("student_id", student.id),
      supabase.from("student_results").select("obtained_marks, total_marks, percentage, grade, division, pass_fail, result_status").eq("student_id", student.id).eq("result_status", "published"),
      supabase.from("certificates").select("certificate_number, certificate_type, issue_date, status, grade").eq("student_id", student.id),
    ]);

    const marks = attendance.data ?? [];
    const counted = marks.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
    const present = (counted.present ?? 0) + (counted.late ?? 0);

    return text({
      student,
      fees: fees.data ?? [],
      attendance: { total_days: marks.length, by_status: counted, present_percentage: marks.length ? Math.round((present / marks.length) * 1000) / 10 : null },
      results: results.data ?? [],
      certificates: certificates.data ?? [],
    });
  },
});
