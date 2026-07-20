import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Printer, ArrowLeft } from "lucide-react";
import { getReceipt, FEE_MODE_LABEL } from "@/lib/fees.functions";
import logoAsset from "@/assets/logo.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard/fees/receipt/$id")({
  head: () => ({ meta: [{ title: "Fee Receipt · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const fetchReceipt = useServerFn(getReceipt);
  const [r, setR] = useState<any>(null);
  useEffect(() => { fetchReceipt({ data: { id } }).then(setR); }, [id, fetchReceipt]);

  if (!r) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading receipt…</div>;
  const st = r.student_fee?.student;

  return (
    <div className="min-h-screen bg-cyan-soft/40 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link to="/dashboard/fees/history" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand"><Printer className="h-4 w-4" /> Print / Save PDF</button>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-soft print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <img src={logoAsset.url} alt="KCC" className="h-14 w-14 rounded-xl object-contain ring-1 ring-border" />
              <div>
                <div className="text-lg font-extrabold text-brand-dark">Krishna Computer Center</div>
                <div className="text-xs text-muted-foreground">Fee Payment Receipt</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Receipt No.</div>
              <div className="font-mono text-lg font-extrabold text-ink">{r.receipt_number || "—"}</div>
              <div className="text-xs text-muted-foreground">{r.payment_date ? new Date(r.payment_date).toLocaleString("en-IN") : "—"}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="Student Name" value={st?.full_name} />
            <Row label="Student ID" value={st?.student_code} />
            <Row label="Enrollment No." value={st?.enrollment_no} />
            <Row label="Course" value={st?.course?.name} />
            <Row label="Branch" value={st?.branch?.name} />
            <Row label="Batch" value={st?.batch?.name || "—"} />
            <Row label="Phone" value={st?.phone} />
            <Row label="Email" value={st?.email || "—"} />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-cyan-soft/60 text-left text-xs font-bold uppercase text-muted-foreground">
                <tr><th className="p-3">Description</th><th className="p-3 text-right">Amount</th></tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-3">Installment #{r.installment_number} — {r.remarks || "Fee payment"}</td><td className="p-3 text-right">₹{Number(r.amount).toLocaleString("en-IN")}</td></tr>
                {Number(r.fine_amount) > 0 && <tr className="border-t"><td className="p-3">Late fine</td><td className="p-3 text-right">₹{Number(r.fine_amount).toLocaleString("en-IN")}</td></tr>}
                {Number(r.discount_amount) > 0 && <tr className="border-t"><td className="p-3 text-emerald-700">Discount</td><td className="p-3 text-right text-emerald-700">− ₹{Number(r.discount_amount).toLocaleString("en-IN")}</td></tr>}
                <tr className="border-t bg-cyan-soft/30 font-bold"><td className="p-3">Amount Paid</td><td className="p-3 text-right text-emerald-700">₹{Number(r.paid_amount).toLocaleString("en-IN")}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="Payment Mode" value={r.payment_mode ? FEE_MODE_LABEL[r.payment_mode as keyof typeof FEE_MODE_LABEL] : "—"} />
            <Row label="Transaction Ref." value={r.transaction_reference || "—"} />
            <Row label="Total Fee" value={`₹${Number(r.student_fee?.final_fee ?? 0).toLocaleString("en-IN")}`} />
            <Row label="Balance Due" value={`₹${Number(r.student_fee?.due_amount ?? 0).toLocaleString("en-IN")}`} tint="text-red-600" />
            <Row label="Collected By" value={r.collector || "Staff"} />
          </div>

          <div className="mt-8 flex items-end justify-between border-t pt-4 text-xs text-muted-foreground">
            <div>
              <div className="font-semibold text-ink">Krishna Computer Center</div>
              <div>Karawal Nagar · Rampark · Delhi</div>
              <div>www.krishnacomputercenter.in</div>
            </div>
            <div className="text-center">
              <div className="grid h-16 w-16 place-items-center rounded-lg border border-dashed text-[10px] text-muted-foreground">QR</div>
              <div className="mt-1">Verify online</div>
            </div>
            <div className="text-right">
              <div className="mb-6 h-8 w-32 border-b border-dashed" />
              <div>Authorised Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tint }: { label: string; value?: string | null; tint?: string }) {
  return (
    <div className="rounded-lg border bg-cyan-soft/20 px-3 py-2">
      <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${tint ?? "text-ink"}`}>{value || "—"}</div>
    </div>
  );
}