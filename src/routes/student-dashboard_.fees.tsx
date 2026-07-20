import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wallet, Receipt, History, Printer } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { myFeeLedger, FEE_STATUS_LABEL, FEE_MODE_LABEL } from "@/lib/fees.functions";

export const Route = createFileRoute("/student-dashboard_/fees")({
  head: () => ({ meta: [{ title: "My Fees · KCC" }, { name: "robots", content: "noindex" }] }),
  component: MyFeesPage,
});

const inr = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function MyFeesPage() {
  const fetchLedger = useServerFn(myFeeLedger);
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchLedger().then(setD).finally(() => setLoading(false)); }, [fetchLedger]);

  const name = d?.student?.full_name || "Student";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const subline = d?.student ? `${d.student.student_code || ""} · ${d.student.course?.name ?? ""}` : "";

  const fee = d?.fee;
  const upcoming = (d?.installments ?? []).find((i: any) => i.status === "pending" || i.status === "overdue");
  const recent = (d?.installments ?? []).filter((i: any) => i.paid_amount > 0).slice(-5).reverse();

  return (
    <PortalShell name={name} initials={initials} subline={subline}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">My Fees</h1>
            <p className="text-sm text-muted-foreground">Your fee ledger, payments and receipts.</p>
          </div>
          <Link to="/student-dashboard/fees/history" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand">
            <History className="h-4 w-4" /> View full history
          </Link>
        </header>

        {loading && <div className="rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft">Loading…</div>}

        {!loading && !fee && (
          <div className="rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft">
            No fee ledger has been created for your account yet. Please contact the accounts desk.
          </div>
        )}

        {fee && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total Fee" value={inr(fee.total_fee)} />
              <Stat label="Paid" value={inr(fee.paid_amount)} tint="text-emerald-600" />
              <Stat label="Due" value={inr(fee.due_amount)} tint="text-red-600" />
              <Stat label="Status" value={FEE_STATUS_LABEL[fee.payment_status as keyof typeof FEE_STATUS_LABEL]} />
            </div>

            {upcoming && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-amber-800">
                  <Wallet className="h-4 w-4" />
                  <div className="text-sm font-bold">Upcoming Installment</div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
                  <div><span className="text-xs text-muted-foreground">Installment #</span><div className="font-semibold">{upcoming.installment_number}</div></div>
                  <div><span className="text-xs text-muted-foreground">Amount</span><div className="font-semibold">{inr(upcoming.amount)}</div></div>
                  <div><span className="text-xs text-muted-foreground">Due Date</span><div className="font-semibold">{upcoming.due_date ? new Date(upcoming.due_date).toLocaleDateString("en-IN") : "—"}</div></div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border bg-white p-5 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink"><Receipt className="h-4 w-4 text-brand" /> Recent Payments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cyan-soft/40 text-left text-xs font-bold uppercase text-muted-foreground">
                    <tr><th className="p-3">Receipt</th><th className="p-3">Date</th><th className="p-3">Mode</th><th className="p-3">Paid</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No payments recorded yet.</td></tr>}
                    {recent.map((i: any) => (
                      <tr key={i.id} className="border-t">
                        <td className="p-3 font-mono text-xs">{i.receipt_number || "—"}</td>
                        <td className="p-3">{i.payment_date ? new Date(i.payment_date).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="p-3">{i.payment_mode ? FEE_MODE_LABEL[i.payment_mode as keyof typeof FEE_MODE_LABEL] : "—"}</td>
                        <td className="p-3 font-semibold text-emerald-700">{inr(i.paid_amount)}</td>
                        <td className="p-3">
                          {i.receipt_number && (
                            <Link to="/student-dashboard/fees/receipt/$id" params={{ id: i.id }} className="inline-flex items-center gap-1 text-brand hover:underline text-xs font-semibold">
                              <Printer className="h-3 w-3" /> Receipt
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-soft">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${tint ?? "text-ink"}`}>{value}</div>
    </div>
  );
}