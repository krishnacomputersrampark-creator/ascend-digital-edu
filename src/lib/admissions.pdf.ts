import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import logoAsset from "@/assets/logo.jpg.asset.json";

const INSTITUTE = "KRISHNA COMPUTER CENTER";
const TAGLINE = "An ISO Certified Computer Training Institute";

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function header(doc: jsPDF, title: string) {
  const logo = await toDataUrl(logoAsset.url);
  if (logo) { try { doc.addImage(logo, "JPEG", 16, 12, 22, 22); } catch { /* ignore */ } }
  doc.setFont("helvetica", "bold").setFontSize(17).setTextColor(15, 118, 139);
  doc.text(INSTITUTE, 44, 21);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  doc.text(TAGLINE, 44, 27);
  doc.setDrawColor(15, 118, 139).setLineWidth(0.8).line(16, 37, 194, 37);
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(20);
  doc.text(title, 105, 47, { align: "center" });
}

function rows(doc: jsPDF, startY: number, data: Array<[string, string]>) {
  let y = startY;
  doc.setFontSize(10);
  for (const [k, v] of data) {
    doc.setFont("helvetica", "bold").setTextColor(90).text(`${k}`, 20, y);
    doc.setFont("helvetica", "normal").setTextColor(20).text(v || "—", 78, y);
    y += 7.5;
  }
  return y;
}

export type AdmissionLike = Record<string, any>;

export async function downloadWelcomeLetter(a: AdmissionLike, student?: AdmissionLike | null) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await header(doc, "ADMISSION WELCOME LETTER");

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(20);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 174, 47, { align: "right" });
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text(`Dear ${a.full_name},`, 20, 60);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(
    doc.splitTextToSize(
      `Congratulations! We are delighted to confirm your admission to ${INSTITUTE}. Your application has been verified and approved. Please find your enrolment details below. Kindly carry this letter on your first day at the centre.`,
      174,
    ),
    20,
    68,
  );

  const y = rows(doc, 92, [
    ["Student Name", a.full_name ?? ""],
    ["Father's Name", a.father_name ?? a.guardian_name ?? ""],
    ["Admission Number", a.admission_no ?? a.application_no ?? ""],
    ["Student ID", student?.student_code ?? ""],
    ["Enrollment No", student?.enrollment_no ?? ""],
    ["Course", a.course?.name ?? a.course_preference ?? ""],
    ["Branch", a.branch?.name ?? ""],
    ["Batch / Timing", `${a.batch?.name ?? "—"}${a.preferred_timing ? ` · ${a.preferred_timing}` : ""}`],
    ["Session", a.session ?? ""],
    ["Joining Date", new Date().toLocaleDateString("en-IN")],
  ]);

  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const qr = await QRCode.toDataURL(
      `${origin}/search/student?id=${encodeURIComponent(student?.enrollment_no ?? student?.student_code ?? a.admission_no ?? "")}`,
      { margin: 1, width: 400 },
    );
    doc.addImage(qr, "PNG", 158, 88, 32, 32);
  } catch { /* ignore */ }

  doc.setFontSize(9).setTextColor(90);
  doc.text(doc.splitTextToSize("Please report to the branch office 15 minutes before your batch time with a copy of this letter and your ID proof.", 174), 20, y + 6);

  doc.setDrawColor(180).line(140, y + 40, 190, y + 40);
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(20);
  doc.text("Director", 165, y + 46, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(120);
  doc.text(INSTITUTE, 165, y + 51, { align: "center" });

  doc.save(`welcome-letter-${a.admission_no ?? a.application_no ?? "student"}.pdf`);
}

export async function downloadAdmissionReceipt(
  a: AdmissionLike,
  opts: { amount?: number; mode?: string; receiptNo?: string } = {},
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await header(doc, "ADMISSION FEE RECEIPT");
  const receiptNo = opts.receiptNo ?? `RCPT-${(a.admission_no ?? a.application_no ?? "").toString().replace(/[^\w-]/g, "")}`;
  const amount = opts.amount ?? Number(a.course?.fees ?? 0) ?? 0;

  rows(doc, 62, [
    ["Receipt Number", receiptNo],
    ["Receipt Date", new Date().toLocaleDateString("en-IN")],
    ["Student Name", a.full_name ?? ""],
    ["Father's Name", a.father_name ?? a.guardian_name ?? ""],
    ["Mobile", a.phone ?? ""],
    ["Admission Number", a.admission_no ?? a.application_no ?? ""],
    ["Course", a.course?.name ?? a.course_preference ?? ""],
    ["Branch", a.branch?.name ?? ""],
    ["Payment Mode", opts.mode ?? "Cash"],
  ]);

  doc.setFillColor(236, 254, 255).rect(16, 140, 178, 18, "F");
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(15, 118, 139);
  doc.text("Admission Fee Paid", 22, 152);
  doc.text(`INR ${Number(amount).toLocaleString("en-IN")}`, 188, 152, { align: "right" });

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(120);
  doc.text("This is a computer generated receipt and does not require a physical signature.", 105, 172, { align: "center" });
  doc.setDrawColor(180).line(140, 190, 190, 190);
  doc.setFontSize(10).setTextColor(20).text("Authorised Signatory", 165, 196, { align: "center" });

  doc.save(`admission-receipt-${receiptNo}.pdf`);
}

export async function downloadApplicationPdf(a: AdmissionLike) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await header(doc, "ADMISSION APPLICATION FORM");
  const y = rows(doc, 60, [
    ["Application No", a.application_no ?? a.admission_no ?? ""],
    ["Status", String(a.status ?? "").toUpperCase()],
    ["Student Name", a.full_name ?? ""],
    ["Father's Name", a.father_name ?? a.guardian_name ?? ""],
    ["Mother's Name", a.mother_name ?? ""],
    ["Gender / DOB", `${a.gender ?? "—"} / ${a.date_of_birth ?? "—"}`],
    ["Blood Group", a.blood_group ?? ""],
    ["Category", a.category ?? ""],
    ["Aadhaar", a.aadhaar_number ?? ""],
    ["Mobile", `${a.phone ?? ""}${a.alternate_mobile ? ` / ${a.alternate_mobile}` : ""}`],
    ["Email", a.email ?? ""],
    ["Address", `${a.address ?? ""}`],
    ["District / State", `${a.district ?? a.city ?? "—"} / ${a.state ?? "—"}`],
    ["PIN", a.pincode ?? ""],
    ["Qualification", a.qualification ?? ""],
    ["School / Board", `${a.school ?? "—"} / ${a.board ?? "—"}`],
    ["Passing Year / %", `${a.passing_year ?? "—"} / ${a.percentage ?? "—"}`],
    ["Branch", a.branch?.name ?? ""],
    ["Course", a.course?.name ?? a.course_preference ?? ""],
    ["Batch / Timing", `${a.batch?.name ?? "—"}${a.preferred_timing ? ` · ${a.preferred_timing}` : ""}`],
    ["Session", a.session ?? ""],
    ["Applied On", a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : ""],
  ]);
  doc.setDrawColor(180).line(20, y + 22, 70, y + 22);
  doc.setFontSize(9).setTextColor(90).text("Applicant Signature", 45, y + 28, { align: "center" });
  doc.line(140, y + 22, 190, y + 22);
  doc.text("Authorised Signatory", 165, y + 28, { align: "center" });
  doc.save(`application-${a.application_no ?? a.admission_no ?? "form"}.pdf`);
}

const LIST_HEADERS: Array<[string, (r: AdmissionLike) => any]> = [
  ["Application ID", (r) => r.application_no ?? r.admission_no],
  ["Student Name", (r) => r.full_name],
  ["Father Name", (r) => r.father_name ?? r.guardian_name],
  ["Mobile", (r) => r.phone],
  ["Email", (r) => r.email],
  ["Course", (r) => r.course?.name ?? r.course_preference],
  ["Branch", (r) => r.branch?.name],
  ["Date", (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "")],
  ["Status", (r) => r.status],
];

function matrix(rowsIn: AdmissionLike[]) {
  return rowsIn.map((r) => Object.fromEntries(LIST_HEADERS.map(([h, get]) => [h, get(r) ?? ""])));
}

export function exportAdmissionsExcel(rowsIn: AdmissionLike[]) {
  const ws = XLSX.utils.json_to_sheet(matrix(rowsIn));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Admissions");
  XLSX.writeFile(wb, `admissions_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAdmissionsCsv(rowsIn: AdmissionLike[]) {
  const ws = XLSX.utils.json_to_sheet(matrix(rowsIn));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admissions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAdmissionsPdf(rowsIn: AdmissionLike[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  await header(doc, "ADMISSIONS REPORT");
  const cols = LIST_HEADERS.map(([h]) => h);
  const widths = [34, 45, 40, 26, 52, 40, 32, 24, 22];
  let y = 58;
  doc.setFontSize(8).setFont("helvetica", "bold").setTextColor(90);
  let x = 14;
  cols.forEach((c, i) => { doc.text(c, x, y); x += widths[i]; });
  doc.setFont("helvetica", "normal").setTextColor(20);
  y += 5;
  for (const r of rowsIn) {
    if (y > 195) { doc.addPage(); y = 20; }
    x = 14;
    LIST_HEADERS.forEach(([, get], i) => {
      doc.text(String(get(r) ?? "").slice(0, 28), x, y);
      x += widths[i];
    });
    y += 5.5;
  }
  doc.save(`admissions_${new Date().toISOString().slice(0, 10)}.pdf`);
}