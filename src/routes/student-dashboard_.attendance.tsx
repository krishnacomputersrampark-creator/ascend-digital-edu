import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { CalendarCheck, Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { myAttendanceMonth } from "@/lib/attendance.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/student-dashboard_/attendance")({
  head: () => ({ meta: [{ title: "My Attendance · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: MyAttendancePage,
});

type Row = { id: string; attendance_date: string; status: string; check_in_time: string | null; check_out_time: string | null; remarks: string | null };

const STATUS_COLOR: Record<string, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-amber-500 text-white",
  half_day: "bg-orange-400 text-white",
  leave: "bg-blue-500 text-white",
  holiday: "bg-slate-400 text-white",
};
const STATUS_LABEL: Record<string, string> = {
  present: "Present", absent: "Absent", late: "Late", half_day: "Half Day", leave: "Leave", holiday: "Holiday",
};

function MyAttendancePage() {
  const fetchMonth = useServerFn(myAttendanceMonth);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Student");
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      if (p?.full_name) setName(p.full_name);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMonth({ data: { year: ym.y, month: ym.m } })
      .then((r) => setRows(r.rows as Row[]))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [ym, fetchMonth]);

  const byDate = useMemo(() => {
    const m = new Map<string, Row>();
    rows.forEach((r) => m.set(r.attendance_date, r));
    return m;
  }, [rows]);

  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0, half_day: 0, leave: 0, holiday: 0 };
    rows.forEach((r) => { (s as any)[r.status]++; });
    const marked = s.present + s.absent + s.late + s.half_day + s.leave;
    const pct = marked ? Math.round(((s.present + s.late * 0.5 + s.half_day * 0.5) / marked) * 100) : 0;
    const today = new Date().toISOString().slice(0, 10);
    const todayStatus = byDate.get(today)?.status ?? null;
    return { ...s, marked, pct, todayStatus };
  }, [rows, byDate]);

  const daysInMonth = new Date(ym.y, ym.m, 0).getDate();
  const firstDow = new Date(ym.y, ym.m - 1, 1).getDay();
  const monthLabel = new Date(ym.y, ym.m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const shift = (delta: number) => {
    let y = ym.y, m = ym.m + delta;
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    setYm({ y, m });
  };

  const printReport = () => window.print();
  const downloadCsv = () => {
    const header = "Date,Status,Check-in,Check-out,Remarks\n";
    const body = rows.map((r) => `${r.attendance_date},${r.status},${r.check_in_time ?? ""},${r.check_out_time ?? ""},"${(r.remarks ?? "").replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${ym.y}-${String(ym.m).padStart(2, "0")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <PortalShell name={name} initials={initials} subline="Attendance">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2"><CalendarCheck className="h-6 w-6 text-brand" /> My Attendance</h1>
            <p className="text-sm text-muted-foreground">View your monthly attendance and download reports.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-soft"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={printReport} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand"><Download className="h-4 w-4" /> Print / PDF</button>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's Status" value={stats.todayStatus ? STATUS_LABEL[stats.todayStatus] : "Not marked"} tone={stats.todayStatus ?? "muted"} />
          <StatCard label="Attendance %" value={`${stats.pct}%`} tone="brand" />
          <StatCard label="Present" value={stats.present} tone="present" />
          <StatCard label="Absent" value={stats.absent} tone="absent" />
          <StatCard label="Late" value={stats.late} tone="late" />
          <StatCard label="Half Day" value={stats.half_day} tone="half_day" />
          <StatCard label="Leave" value={stats.leave} tone="leave" />
          <StatCard label="Holiday" value={stats.holiday} tone="holiday" />
        </div>

        {/* Calendar */}
        <section className="mt-6 rounded-3xl border bg-white/80 backdrop-blur p-6 shadow-soft">
          <header className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => shift(-1)} className="grid h-9 w-9 place-items-center rounded-full border bg-white hover:bg-cyan-soft"><ChevronLeft className="h-4 w-4" /></button>
              <h2 className="min-w-[180px] text-center text-lg font-bold text-ink">{monthLabel}</h2>
              <button onClick={() => shift(1)} className="grid h-9 w-9 place-items-center rounded-full border bg-white hover:bg-cyan-soft"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <Legend />
          </header>
          {loading ? (
            <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} className="text-center font-semibold text-muted-foreground py-1">{d}</div>
              ))}
              {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const dateStr = `${ym.y}-${String(ym.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const r = byDate.get(dateStr);
                const cls = r ? STATUS_COLOR[r.status] : "bg-white text-ink/70 border";
                return (
                  <button
                    key={d}
                    onClick={() => r && setSelected(r)}
                    className={`aspect-square rounded-lg p-1.5 text-left transition hover:scale-[1.03] ${cls}`}
                    disabled={!r}
                    title={r ? STATUS_LABEL[r.status] : ""}
                  >
                    <div className="text-[11px] font-bold">{d}</div>
                    {r && <div className="mt-0.5 text-[9px] font-semibold uppercase opacity-90">{r.status[0]}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSelected(null)}>
            <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-ink">{new Date(selected.attendance_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div><span className="text-muted-foreground">Status: </span><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[selected.status]}`}>{STATUS_LABEL[selected.status]}</span></div>
                {selected.check_in_time && <div><span className="text-muted-foreground">Check-in: </span>{selected.check_in_time}</div>}
                {selected.check_out_time && <div><span className="text-muted-foreground">Check-out: </span>{selected.check_out_time}</div>}
                {selected.remarks && <div><span className="text-muted-foreground">Remarks: </span>{selected.remarks}</div>}
              </div>
              <button onClick={() => setSelected(null)} className="mt-5 w-full rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white">Close</button>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: React.ReactNode; tone: string }) {
  const toneCls: Record<string, string> = {
    brand: "from-brand to-cyan text-white",
    present: "from-emerald-500 to-emerald-600 text-white",
    absent: "from-red-500 to-red-600 text-white",
    late: "from-amber-500 to-amber-600 text-white",
    half_day: "from-orange-400 to-orange-500 text-white",
    leave: "from-blue-500 to-blue-600 text-white",
    holiday: "from-slate-400 to-slate-500 text-white",
    muted: "from-slate-100 to-slate-200 text-ink",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${toneCls[tone] ?? toneCls.muted} p-4 shadow-soft`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [["Present", "bg-emerald-500"], ["Absent", "bg-red-500"], ["Late", "bg-amber-500"], ["Leave", "bg-blue-500"], ["Holiday", "bg-slate-400"]];
  return (
    <div className="hidden gap-3 sm:flex">
      {items.map(([l, c]) => (
        <span key={l} className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className={`inline-block h-3 w-3 rounded ${c}`} /> {l}
        </span>
      ))}
    </div>
  );
}