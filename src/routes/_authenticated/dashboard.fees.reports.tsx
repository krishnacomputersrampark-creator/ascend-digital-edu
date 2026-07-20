import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Printer } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { feeReports } from "@/lib/fees.functions";

export const Route = createFileRoute("/_authenticated/dashboard/fees/reports")({
  head: () => ({ meta: [{ title: "Fee Reports · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: FeeReportsPage,
});

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const COLORS = ["#0891b2","#06b6d4","#0ea5e9","#22d3ee","#67e8f9","#a5f3fc","#f59e0b","#ef4444"];

function FeeReportsPage() {
  const fetchReport = useServerFn(feeReports);
  const [data, setData] = useState<any>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    const r = await fetchReport({ data: { from: from || undefined, to: to || undefined } });
    setData(r);
  };
  useEffect(() => { load(); }, []);

  const exportCsv = (rows: any[], name: string) => {
    const header = Object.keys(rows[0] ?? {});
    const csv = [header.join(","), ...rows.map((r) => header.map((h) => `"${String(r[h] ?? "")}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
  };

  return (
    <DashboardShell
      title="Fee Reports"
      subtitle="Collections, discounts, fines and outstanding dues."
      actions={
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand"><Printer className="h-4 w-4" /> Print</button>
      }
    >
      <section className="rounded-2xl border bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" /></div>
          <button onClick={load} className="rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-brand">Apply</button>
        </div>
      </section>

      {data && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Card label="Total Collected" value={inr(data.totalCollected)} tint="from-emerald-500 to-teal-500" />
            <Card label="Fine Collected" value={inr(data.totalFine)} tint="from-amber-500 to-orange-500" />
            <Card label="Discount Given" value={inr(data.totalDiscount)} tint="from-cyan-500 to-brand" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ChartCard title="Course-wise Collection" onExport={() => exportCsv(data.byCourse, "course-collection")}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byCourse}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="amount" fill="#0891b2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Branch-wise Collection" onExport={() => exportCsv(data.byBranch, "branch-collection")}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byBranch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="amount" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Mode-wise Collection" onExport={() => exportCsv(data.byMode, "mode-collection")}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.byMode} dataKey="amount" nameKey="name" outerRadius={100} label>
                    {data.byMode.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Outstanding Fees" onExport={() => exportCsv(data.outstanding, "outstanding")}>
              <div className="max-h-[280px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-cyan-soft/40 text-left text-[10px] font-bold uppercase text-muted-foreground">
                    <tr><th className="p-2">Student</th><th className="p-2">Course</th><th className="p-2">Branch</th><th className="p-2 text-right">Due</th></tr>
                  </thead>
                  <tbody>
                    {data.outstanding.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No outstanding dues 🎉</td></tr>}
                    {data.outstanding.map((r: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2"><div className="font-semibold">{r.name}</div><div className="text-[10px] text-muted-foreground">{r.code}</div></td>
                        <td className="p-2">{r.course}</td>
                        <td className="p-2">{r.branch}</td>
                        <td className="p-2 text-right font-bold text-red-600">{inr(r.due_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Card({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-soft">
      <div className={`mb-2 h-1.5 w-16 rounded-full bg-gradient-to-r ${tint}`} />
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
function ChartCard({ title, children, onExport }: { title: string; children: React.ReactNode; onExport: () => void }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <button onClick={onExport} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><Download className="h-3 w-3" /> CSV</button>
      </div>
      {children}
    </div>
  );
}