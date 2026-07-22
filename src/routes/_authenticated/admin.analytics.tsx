import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  fetchStudentGrowth, fetchBranchComparison, fetchCoursePopularity, fetchMonthlyRevenue, type TrendPoint,
} from "@/lib/admin.repo";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [growth, setGrowth] = useState<TrendPoint[]>([]);
  const [branchCmp, setBranchCmp] = useState<TrendPoint[]>([]);
  const [coursePop, setCoursePop] = useState<TrendPoint[]>([]);
  const [revenue, setRevenue] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStudentGrowth(12), fetchBranchComparison(), fetchCoursePopularity(), fetchMonthlyRevenue(12)])
      .then(([g, b, c, r]) => { setGrowth(g); setBranchCmp(b); setCoursePop(c); setRevenue(r); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardShell title="Analytics"><div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></DashboardShell>
  );

  return (
    <DashboardShell title="Analytics" subtitle="Institute performance across 12 months">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Student Growth (12 months)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growth}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/><stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="key" fontSize={11} /><YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#0891b2" fill="url(#sg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Monthly Revenue (₹)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="key" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Branch Comparison (students)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={branchCmp}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="key" fontSize={11} /><YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Top Courses (enrolment)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={coursePop} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="key" fontSize={11} width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="mb-3 text-sm font-bold text-ink">{title}</div>
      {children}
    </div>
  );
}