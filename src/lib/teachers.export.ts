import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { inr } from "@/lib/teachers.shared";

type Row = Record<string, any>;

const HEADERS: Array<[string, (r: Row) => any]> = [
  ["Teacher ID", (r) => r.teacher_id],
  ["Employee Code", (r) => r.employee_code],
  ["Name", (r) => r.full_name],
  ["Father", (r) => r.father_name],
  ["Gender", (r) => r.gender],
  ["DOB", (r) => r.dob],
  ["Mobile", (r) => r.mobile],
  ["Alt Mobile", (r) => r.alternate_mobile],
  ["Email", (r) => r.email],
  ["Address", (r) => r.address],
  ["District", (r) => r.district],
  ["State", (r) => r.state],
  ["PIN", (r) => r.pin_code],
  ["Qualification", (r) => r.qualification],
  ["Experience", (r) => r.experience],
  ["Designation", (r) => r.designation],
  ["Department", (r) => r.department],
  ["Branch", (r) => r.branch?.name],
  ["Subjects", (r) => r.subjects],
  ["Joining Date", (r) => r.joining_date],
  ["Salary", (r) => r.salary],
  ["Status", (r) => r.status],
];

const toMatrix = (rows: Row[]) =>
  rows.map((r) => Object.fromEntries(HEADERS.map(([h, get]) => [h, get(r) ?? ""])));

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportTeachersXlsx(rows: Row[]) {
  const ws = XLSX.utils.json_to_sheet(toMatrix(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Teachers");
  XLSX.writeFile(wb, `teachers_${stamp()}.xlsx`);
}

export function exportTeachersCsv(rows: Row[]) {
  const ws = XLSX.utils.json_to_sheet(toMatrix(rows));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `teachers_${stamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTeachersPdf(rows: Row[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Krishna Computer Center — Teachers", 40, 40);
  doc.setFontSize(9);
  const cols = ["Teacher ID", "Name", "Mobile", "Designation", "Department", "Branch", "Joining", "Status"];
  let y = 70;
  cols.forEach((c, i) => doc.text(c, 40 + i * 95, y));
  y += 14;
  for (const r of rows) {
    if (y > 540) {
      doc.addPage();
      y = 50;
    }
    const cells = [
      r.teacher_id, r.full_name, r.mobile, r.designation ?? "-", r.department ?? "-",
      r.branch?.name ?? "-", r.joining_date ?? "-", r.status,
    ];
    cells.forEach((c, i) => doc.text(String(c ?? "").slice(0, 22), 40 + i * 95, y));
    y += 14;
  }
  doc.save(`teachers_${stamp()}.pdf`);
}

export function downloadTeacherImportTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      Name: "Ramesh Kumar", Mobile: "9876543210", Email: "ramesh@example.com",
      Qualification: "MCA", Experience: "5 years", Designation: "Instructor",
      Department: "Programming", Subjects: "C, C++, Java", "Joining Date": "2024-06-01",
      Salary: 25000, Branch: "MAIN",
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "teachers_import_template.xlsx");
}

export async function parseTeacherImportFile(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const ws = wb.Sheets[first];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
}

/** Opens a printable teacher ID card in a new window. */
export function printTeacherIdCard(t: Row, photoUrl?: string | null) {
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${t.full_name} — ID Card</title>
  <style>
    body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f1f5f9}
    .card{width:320px;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.12)}
    .hd{background:#0891b2;color:#fff;padding:14px;text-align:center}
    .hd h1{font-size:14px;margin:0;letter-spacing:.5px}
    .bd{padding:16px;text-align:center}
    img{width:96px;height:96px;object-fit:cover;border-radius:12px;border:2px solid #e2e8f0}
    .nm{font-size:16px;font-weight:800;margin-top:10px}
    .rl{font-size:12px;color:#0891b2;font-weight:700}
    table{width:100%;font-size:11px;margin-top:12px;text-align:left}
    td{padding:3px 0}
    td.k{color:#64748b;width:42%}
    .ft{background:#0f172a;color:#fff;font-size:10px;text-align:center;padding:8px}
  </style></head><body onload="window.print()">
  <div class="card">
    <div class="hd"><h1>KRISHNA COMPUTER CENTER</h1><div style="font-size:10px">Faculty Identity Card</div></div>
    <div class="bd">
      ${photoUrl ? `<img src="${photoUrl}" alt="${t.full_name}" />` : ""}
      <div class="nm">${t.full_name ?? ""}</div>
      <div class="rl">${t.designation ?? "Faculty"}</div>
      <table>
        <tr><td class="k">Teacher ID</td><td>${t.teacher_id ?? "-"}</td></tr>
        <tr><td class="k">Employee Code</td><td>${t.employee_code ?? "-"}</td></tr>
        <tr><td class="k">Department</td><td>${t.department ?? "-"}</td></tr>
        <tr><td class="k">Branch</td><td>${t.branch?.name ?? "-"}</td></tr>
        <tr><td class="k">Mobile</td><td>${t.mobile ?? "-"}</td></tr>
        <tr><td class="k">Joined</td><td>${t.joining_date ?? "-"}</td></tr>
      </table>
    </div>
    <div class="ft">If found, please return to the nearest KCC branch</div>
  </div></body></html>`);
  w.document.close();
}

/** Opens a printable teacher profile sheet. */
export function printTeacherProfile(t: Row) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  const row = (k: string, v: any) => `<tr><td class="k">${k}</td><td>${v ?? "-"}</td></tr>`;
  w.document.write(`<!doctype html><html><head><title>${t.full_name} — Profile</title>
  <style>body{font-family:system-ui,sans-serif;padding:32px;color:#0f172a}
  h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;margin:20px 0 6px;color:#0891b2}
  table{width:100%;border-collapse:collapse;font-size:12px}
  td{border-bottom:1px solid #e2e8f0;padding:6px 4px}td.k{color:#64748b;width:28%}
  </style></head><body onload="window.print()">
  <h1>Krishna Computer Center — Faculty Profile</h1>
  <div style="font-size:12px;color:#64748b">${t.teacher_id ?? ""} · ${t.employee_code ?? ""}</div>
  <h2>Personal</h2><table>
  ${row("Name", t.full_name)}${row("Father", t.father_name)}${row("Mother", t.mother_name)}
  ${row("Gender", t.gender)}${row("Date of Birth", t.dob)}${row("Blood Group", t.blood_group)}</table>
  <h2>Contact</h2><table>
  ${row("Mobile", t.mobile)}${row("Alternate", t.alternate_mobile)}${row("Email", t.email)}
  ${row("Address", t.address)}${row("District", t.district)}${row("State", t.state)}${row("PIN", t.pin_code)}</table>
  <h2>Employment</h2><table>
  ${row("Designation", t.designation)}${row("Department", t.department)}${row("Branch", t.branch?.name)}
  ${row("Qualification", t.qualification)}${row("Experience", t.experience)}${row("Subjects", t.subjects)}
  ${row("Working Days", t.working_days)}${row("Timings", t.preferred_timings)}
  ${row("Joining Date", t.joining_date)}${row("Salary", inr(t.salary))}${row("Status", t.status)}</table>
  </body></html>`);
  w.document.close();
}