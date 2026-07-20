import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled hook: scans fee_installments and creates notifications for
 * students with upcoming (within 7 days) or overdue installments.
 * Idempotent per (installment, kind, YYYY-MM-DD) via link marker.
 */
export const Route = createFileRoute("/api/public/hooks/fee-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const today = new Date();
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        const todayStr = iso(today);
        const in7 = new Date(today);
        in7.setDate(in7.getDate() + 7);

        const { data: rows, error } = await supabaseAdmin
          .from("fee_installments")
          .select(
            "id, installment_number, due_date, amount, paid_amount, fine_amount, discount_amount, status, student_fee:student_fees(id, student_id, student:students(id, full_name, branch_id))"
          )
          .in("status", ["pending", "partially_paid"])
          .lte("due_date", iso(in7));

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        let upcoming = 0;
        let overdue = 0;
        let skipped = 0;

        for (const r of (rows ?? []) as any[]) {
          const sf = r.student_fee;
          const student = sf?.student;
          if (!student?.id) continue;

          const balance =
            Number(r.amount ?? 0) +
            Number(r.fine_amount ?? 0) -
            Number(r.discount_amount ?? 0) -
            Number(r.paid_amount ?? 0);
          if (balance <= 0) continue;

          const kind = r.due_date < todayStr ? "overdue" : "upcoming";
          const marker = `fee:${kind}:${r.id}:${todayStr}`;
          const link = `/student-dashboard/fees?ref=${marker}`;

          const { data: existing } = await supabaseAdmin
            .from("notifications")
            .select("id")
            .eq("student_id", student.id)
            .eq("link", link)
            .limit(1)
            .maybeSingle();
          if (existing) {
            skipped++;
            continue;
          }

          const amt = balance.toFixed(2);
          const title =
            kind === "overdue"
              ? `Overdue fee installment #${r.installment_number}`
              : `Upcoming fee due on ${r.due_date}`;
          const description =
            kind === "overdue"
              ? `Installment #${r.installment_number} of ₹${amt} was due on ${r.due_date}. Please pay to avoid additional fines.`
              : `Installment #${r.installment_number} of ₹${amt} is due on ${r.due_date}.`;

          const { error: insErr } = await supabaseAdmin
            .from("notifications")
            .insert({
              title,
              description,
              type: kind === "overdue" ? "fee_overdue" : "fee_due",
              student_id: student.id,
              branch_id: student.branch_id ?? null,
              link,
            });
          if (!insErr) {
            if (kind === "overdue") overdue++;
            else upcoming++;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            scanned: rows?.length ?? 0,
            upcoming,
            overdue,
            skipped,
            timestamp: new Date().toISOString(),
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
