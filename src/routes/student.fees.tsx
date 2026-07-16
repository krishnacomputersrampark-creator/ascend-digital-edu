import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Download, Printer, CreditCard } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/fees")({
  head: () => ({ meta: [{ title: "Fees — Krishna Computer Center" }, { name: "description", content: "View fee status, paid & pending amounts, due dates, payment history and download receipts." }, { name: "robots", content: "noindex" }] }),
  component: FeesPage,
});

function FeesPage() {
  const paid = 12000, pending = 6000, total = paid + pending;
  const rows = [
    { d: "05 Jan 2024", inv: "INV/24/001", amt: 5000, mode: "UPI", status: "Paid" },
    { d: "05 Apr 2024", inv: "INV/24/002", amt: 4000, mode: "Cash", status: "Paid" },
    { d: "05 Jul 2024", inv: "INV/24/003", amt: 3000, mode: "UPI", status: "Paid" },
    { d: "05 Oct 2024", inv: "INV/24/004", amt: 6000, mode: "—", status: "Pending" },
  ];
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Finance"
        title={<>Fee <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Status</span></>}
        subtitle="Track paid & pending amounts, download receipts and pay online."
      />
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border bg-white p-6 shadow-soft">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Total Fee</div>
              <div className="mt-2 text-3xl font-extrabold text-ink">₹{total.toLocaleString()}</div>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-soft">
              <div className="text-xs font-semibold uppercase text-emerald-700">Paid</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">₹{paid.toLocaleString()}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-50"><div className="h-full bg-emerald-500" style={{width:`${(paid/total)*100}%`}} /></div>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-soft">
              <div className="text-xs font-semibold uppercase text-amber-700">Pending</div>
              <div className="mt-2 text-3xl font-extrabold text-amber-600">₹{pending.toLocaleString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">Due: 05 Oct 2024</div>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand"><CreditCard className="h-3.5 w-3.5" /> Pay Now</button>
            </div>
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl border bg-white shadow-soft">
            <div className="flex items-center justify-between p-5">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2"><Wallet className="h-5 w-5 text-brand" /> Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cyan-soft/60 text-left text-xs uppercase tracking-wider text-brand-dark">
                  <tr><th className="p-3">Date</th><th className="p-3">Invoice</th><th className="p-3">Amount</th><th className="p-3">Mode</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.inv}>
                      <td className="p-3">{r.d}</td>
                      <td className="p-3 font-semibold">{r.inv}</td>
                      <td className="p-3">₹{r.amt.toLocaleString()}</td>
                      <td className="p-3">{r.mode}</td>
                      <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status==="Paid"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{r.status}</span></td>
                      <td className="p-3 text-right">
                        {r.status === "Paid" ? (
                          <div className="inline-flex gap-1.5">
                            <button className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"><Download className="h-3 w-3" /> PDF</button>
                            <button onClick={()=>typeof window!=="undefined"&&window.print()} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"><Printer className="h-3 w-3" /> Print</button>
                          </div>
                        ) : <button className="rounded-full gradient-brand px-3 py-1 text-xs font-semibold text-white">Pay</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}