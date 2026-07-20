import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Printer } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { myFeeLedger, FEE_STATUS_LABEL, FEE_MODE_LABEL } from "@/lib/fees.functions";

export const Route = createFileRoute("/student-dashboard_/fees/history")({
  head: () => ({ meta: [{ title: "Fee History · KCC" }, { name: "robots", content: "noindex" }] }),
  component: MyFeeHistory,
});

const inr = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function MyFeeHistory() {
  const fetchLedger = useServerFn(myFeeLedger);
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetchLedger().then(setD); }, [fetchLedger]);
  const name = d?.student?.full_name || "Student";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <PortalShell name={name} initials={initials}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/student-dashboard/fees" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><ArrowLeft className="h-4 w-4" /> Back to fees</Link>
        <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">Full Payment History</h1>
        <div className="mt-5 overflow-x-auto rounded-2xl border bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-cyan-soft/40 text-left text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3">#</th><th className="p-3">Receipt</th><th className="p-3">Date</th>
                <th className="p-3">Mode</th><th className="p-3">Amount</th><th className="p-3">Paid</th>
                <th className="p-3">Status</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(d?.installments ?? []).length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No installments yet.</td></tr>}
              {(d?.installments ?? []).map((i: any) => (
                <tr key={i.id} className="border-t">
                  <td className="p-3 font-semibold">{i.installment_number}</td>
                  <td className="p-3 font-mono text-xs">{i.receipt_number || "—"}</td>
                  <td className="p-3">{i.payment_date ? new Date(i.payment_date).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-3">{i.payment_mode ? FEE_MODE_LABEL[i.payment_mode as keyof typeof FEE_MODE_LABEL] : "—"}</td>
                  <td className="p-3">{inr(i.amount)}</td>
                  <td className="p-3 font-semibold text-emerald-700">{inr(i.paid_amount)}</td>
                  <td className="p-3">{FEE_STATUS_LABEL[i.status as keyof typeof FEE_STATUS_LABEL]}</td>
                  <td className="p-3">
                    {i.receipt_number && (
                      <Link to="/student-dashboard/fees/receipt/$id" params={{ id: i.id }} className="inline-flex items-center gap-1 text-brand hover:underline text-xs font-semibold">
                        <Printer className="h-3 w-3" /> Open
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}