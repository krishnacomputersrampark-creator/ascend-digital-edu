import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { fmtTime, inr } from "@/lib/courses.shared";

type Row = Record<string, any>;

const COURSE_HEADERS: Array<[string, (r: Row) => any]> = [
  ["Course Code", (r) => r.code],
  ["Course Name", (r) => r.name],
  ["Short Name", (r) => r.short_name],
  ["Category", (r) => r.category],
  ["Duration", (r) => `${r.duration ?? ""} ${r.duration_unit ?? ""}`.trim()],
  ["Hours", (r) => r.hours],
  ["Medium", (r) => r.medium],
  ["Certificate Type", (r) => r.certificate_type],
  ["Training Partner", (r) => r.training_partner],
  ["Mode", (r) => r.mode],
  ["Course Fee", (r) => r.course_fee],
  ["Registration Fee", (r) => r.registration_fee],
  ["Exam Fee", (r) => r.exam_fee],
  ["Eligibility", (r) => r.eligibility],
  ["Status", (r) => r.status],
];

const BATCH_HEADERS: Array<[string, (r: Row) => any]> = [
  ["Batch Code", (r) => r.code],
  ["Batch Name", (r) => r.name],
  ["Course", (r) => r.course?.name],
  ["Teacher", (r) => r.teacher?.full_name],
  ["Branch", (r) => r.branch?.name],
  ["Session", (r) => r.session],
  ["Timing", (r) => `${fmtTime(r.start_time)} - ${fmtTime(r.end_time)}`],
  ["Days", (r) => (r.days ?? []).join("/")],
  ["Start Date", (r) => r.start_date],
  ["End Date", (r) => r.end_date],
  ["Capacity", (r) => r.capacity],
  ["Students", (r) => r.current_strength],
  ["Room", (r) => r.room_number],
  ["Mode", (r) => r.mode],
  ["Status", (r) => r.status],
];

const stamp = () => new Date().toISOString().slice(0, 10);

const toMatrix = (rows: Row[], headers: typeof COURSE_HEADERS) =>
  rows.map((r) => Object.fromEntries(headers.map(([h, get]) => [h, get(r) ?? ""])));

function downloadBlob(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function xlsx(rows: Row[], headers: typeof COURSE_HEADERS, sheet: string, file: string) {
  const ws = XLSX.utils.json_to_sheet(toMatrix(rows, headers));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, `${file}-${stamp()}.xlsx`);
}

function csv(rows: Row[], headers: typeof COURSE_HEADERS, file: string) {
  const head = headers.map(([h]) => h).join(",");
  const body = rows
    .map((r) => headers.map(([, get]) => `"${String(get(r) ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(`${head}\n${body}`, `${file}-${stamp()}.csv`, "text/csv;charset=utf-8;");
}

function pdf(rows: Row[], headers: typeof COURSE_HEADERS, title: string, file: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(`Krishna Computer Center — ${title}`, 40, 40);
  doc.setFontSize(8);
  const cols = headers.slice(0, 10);
  const w = (doc.internal.pageSize.getWidth() - 80) / cols.length;
  let y = 70;
  cols.forEach(([h], i) => doc.text(String(h), 40 + i * w, y));
  y += 14;
  rows.forEach((r) => {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 50;
    }
    cols.forEach(([, get], i) => doc.text(String(get(r) ?? "").slice(0, 22), 40 + i * w, y));
    y += 13;
  });
  doc.save(`${file}-${stamp()}.pdf`);
}

export const exportCoursesXlsx = (rows: Row[]) => xlsx(rows, COURSE_HEADERS, "Courses", "kcc-courses");
export const exportCoursesCsv = (rows: Row[]) => csv(rows, COURSE_HEADERS, "kcc-courses");
export const exportCoursesPdf = (rows: Row[]) => pdf(rows, COURSE_HEADERS, "Courses", "kcc-courses");
export const exportBatchesXlsx = (rows: Row[]) => xlsx(rows, BATCH_HEADERS, "Batches", "kcc-batches");
export const exportBatchesCsv = (rows: Row[]) => csv(rows, BATCH_HEADERS, "kcc-batches");
export const exportBatchesPdf = (rows: Row[]) => pdf(rows, BATCH_HEADERS, "Batches", "kcc-batches");

export function printTable(title: string, rows: Row[], kind: "courses" | "batches") {
  const headers = kind === "courses" ? COURSE_HEADERS : BATCH_HEADERS;
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return;
  w.document.write(`<html><head><title>${title}</title><style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}
    h1{font-size:18px;margin:0 0 12px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}
    th{background:#e0f2fe}
  </style></head><body><h1>Krishna Computer Center — ${title}</h1><table><thead><tr>
    ${headers.map(([h]) => `<th>${h}</th>`).join("")}</tr></thead><tbody>
    ${rows.map((r) => `<tr>${headers.map(([, get]) => `<td>${String(get(r) ?? "")}</td>`).join("")}</tr>`).join("")}
  </tbody></table></body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function downloadCourseTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      "Course Name": "ADCA", "Course Code": "", "Short Name": "ADCA", Category: "Computer Courses",
      Duration: "12", "Duration Unit": "months", "Course Fee": 8000, "Registration Fee": 500,
      "Exam Fee": 300, "Certificate Type": "Institute", Medium: "Bilingual", Eligibility: "10th Pass", Status: "active",
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Courses");
  XLSX.writeFile(wb, "kcc-courses-template.xlsx");
}

export function downloadBatchTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      "Batch Name": "ADCA Morning A", "Batch Code": "", Course: "ADCA", Branch: "Main Branch",
      Session: "Morning", "Start Date": "2026-01-05", "End Date": "2026-12-20",
      "Start Time": "08:00", "End Time": "10:00", Capacity: 30, Room: "R-101", Status: "upcoming",
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Batches");
  XLSX.writeFile(wb, "kcc-batches-template.xlsx");
}

export async function parseImportFile(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const ws = wb.Sheets[first];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
}

export const money = inr;