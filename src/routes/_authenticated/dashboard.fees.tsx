import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wallet, TrendingUp, AlertCircle, Clock, Plus, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { feeAnalytics } from "@/lib/fees.functions";

export const Route = createFileRoute("/_authenticated/dashboard/fees")({
  head: () => ({ meta: [{ title: "Fee Management · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: FeesOverviewPage,
});

const inr = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function FeesOverviewPage() {
  const fetchStats = useServerFn(feeAnalytics);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchStats().then(setStats).finally(() => setLoading(false)); }, [fetchStats]);

  const cards = [
    { icon: Wallet, label: "Today's Collection", value: inr(stats?.todayCollection ?? 0), tint: "from-emerald-500 to-teal-500" },
    { icon: TrendingUp, label: "This Month", value: inr(stats?.monthCollection ?? 0), tint: "from-cyan-500 to-brand" },
    { icon: AlertCircle, label: "Outstanding", value: inr(stats?.outstanding ?? 0), tint: "from-red-500 to-orange-500" },
    { icon: Clock, label: "Pending Fees", value: String(stats?.pending ?? 0), tint: "from-amber-500 to-yellow-500" },
  ];

  return (
    <DashboardShell
      title="Fee Management"
      subtitle="Track collections, dues and analytics across branches."
      actions={
        <>
          <Link to="/dashboard/fees/collect" className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">
            <Plus className="h-4 w-4" /> Collect Fee
          </Link>
          <Link to="/dashboard/fees/history" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand">History</Link>
          <Link to="/dashboard/fees/reports" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand">Reports</Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-soft">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${c.tint} text-white`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-ink">{loading ? "…" : c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-ink">Monthly Collection Trend</h3>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
          <Link to="/dashboard/fees/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            View reports <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.trend ?? []}>
              <defs>
                <linearGradient id="feeArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Area type="monotone" dataKey="amount" stroke="#0891b2" strokeWidth={2} fill="url(#feeArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardShell>
  );
}