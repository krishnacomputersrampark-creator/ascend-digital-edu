import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { inr, netPayable } from "@/lib/students.shared";

type Row = Record<string, any>;

const EXPORT_HEADERS: Array<[string, (r: Row) => any]> = [
  ["Admission No", (r) => r.admission_number],
  ["Student ID", (r) => r.student_code],
  ["Enrollment No", (r) => r.enrollment_no],
  ["Roll No", (r) => r.roll_no],
  ["Name", (r) => r.full_name],
  ["Father", (r) => r.father_name],
  ["Mother", (r) => r.mother_name],
  ["Gender", (r) => r.gender],
  ["DOB", (r) => r.date_of_birth],
  ["Category", (r) => r.category],
  ["Mobile", (r) => r.phone],
  ["Alt Mobile", (r) => r.alternate_mobile],
  ["Email", (r) => r.email],
  ["Address", (r) => r.address],
  ["City", (r) => r.city],
  ["District", (r) => r.district],
  ["State", (r) => r.state],
  ["PIN", (r) => r.pincode],
  ["Course", (r) => r.course?.name],
  ["Branch", (r) => r.branch?.name],
  ["Batch", (r) => r.batch?.name],
  ["Joined", (r) => r.joined_at],
  ["Status", (r) => r.status],
  ["Course Fee", (r) => r.course_fee],
  ["Discount", (r) => r.discount],
  ["Net Payable", (r) => netPayable(r)],
];

function toMatrix(rows: Row[]) {
  return rows.map((r) => Object.fromEntries(EXPORT_HEADERS.map(([h, get]) => [h, get(r) ?? ""])));
}

export function exportStudentsXlsx(rows: Row[]) {
  const ws = XLSX.utils.json_to_sheet(toMatrix(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, `students_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportStudentsCsv(rows: Row[]) {
  const ws = XLSX.utils.json_to_sheet(toMatrix(rows));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStudentsPdf(rows: Row[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text("Krishna Computer Center — Student List", 40, 40);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")} · ${rows.length} records`, 40, 56);

  const cols = ["Admission No", "Student ID", "Name", "Father", "Mobile", "Course", "Branch", "Status"];
  const widths = [95, 80, 120, 110, 75, 120, 110, 60];
  let y = 80;
  doc.setFont("helvetica", "bold");
  let x = 40;
  cols.forEach((c, i) => {
    doc.text(c, x, y);
    x += widths[i]!;
  });
  doc.setFont("helvetica", "normal");
  y += 14;
  for (const r of rows) {
    if (y > 540) {
      doc.addPage();
      y = 50;
    }
    const vals = [
      r.admission_number ?? "",
      r.student_code ?? "",
      r.full_name ?? "",
      r.father_name ?? "",
      r.phone ?? "",
      r.course?.name ?? "",
      r.branch?.name ?? "",
      r.status ?? "",
    ];
    x = 40;
    vals.forEach((v, i) => {
      doc.text(String(v).slice(0, 26), x, y);
      x += widths[i]!;
    });
    y += 14;
  }
  doc.save(`students_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadImportTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      full_name: "Ramesh Kumar",
      branch_code: "KCC-KN",
      course_code: "DCA",
      father_name: "Suresh Kumar",
      mother_name: "Sita Devi",
      phone: "9876543210",
      email: "ramesh@example.com",
      date_of_birth: "2003-04-12",
      gender: "male",
      category: "General",
      aadhaar_number: "123456789012",
      address: "12 MG Road",
      city: "Patna",
      district: "Patna",
      state: "Bihar",
      pincode: "800001",
      joined_at: "2026-01-10",
      status: "active",
      course_fee: 12000,
      admission_fee: 500,
      registration_fee: 300,
      discount: 0,
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "students_import_template.xlsx");
}

export async function parseImportFile(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
}

/** Generates a printable A4 admission form PDF for one student. */
export function printAdmissionForm(s: Row) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(18);
  doc.text("KRISHNA COMPUTER CENTER", 297, 50, { align: "center" });
  doc.setFontSize(12);
  doc.text("Student Admission Form", 297, 70, { align: "center" });
  doc.setDrawColor(200);
  doc.line(40, 82, 555, 82);

  const lines: Array<[string, any]> = [
    ["Admission No", s.admission_number],
    ["Student ID", s.student_code],
    ["Enrollment No", s.enrollment_no],
    ["Name", s.full_name],
    ["Father's Name", s.father_name],
    ["Mother's Name", s.mother_name],
    ["Date of Birth", s.date_of_birth],
    ["Gender", s.gender],
    ["Category", s.category],
    ["Aadhaar", s.aadhaar_number],
    ["Mobile", s.phone],
    ["Email", s.email],
    ["Address", [s.address, s.city, s.district, s.state, s.pincode].filter(Boolean).join(", ")],
    ["Course", s.course?.name],
    ["Branch", s.branch?.name],
    ["Batch", s.batch?.name],
    ["Joining Date", s.joined_at],
    ["Course Fee", inr(s.course_fee)],
    ["Discount", inr(s.discount)],
    ["Net Payable", inr(netPayable(s))],
  ];
  let y = 110;
  doc.setFontSize(10);
  for (const [k, v] of lines) {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 50, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v ?? "—"), 190, y);
    y += 20;
  }
  doc.text("Student Signature: ______________________", 50, y + 30);
  doc.text("Authorised Signatory: ______________________", 300, y + 30);
  doc.save(`admission_form_${s.student_code ?? "student"}.pdf`);
}

/** Generates a printable ID card PDF with a QR code linking to the student record. */
export async function printIdCard(s: Row, origin: string) {
  const qr = await QRCode.toDataURL(`${origin}/search/student?id=${encodeURIComponent(s.enrollment_no ?? s.student_code ?? "")}`, {
    margin: 1,
    width: 240,
  });
  const doc = new jsPDF({ unit: "pt", format: [242, 153], orientation: "landscape" });
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, 242, 32, "F");
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.text("KRISHNA COMPUTER CENTER", 121, 20, { align: "center" });
  doc.setTextColor(20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(String(s.full_name ?? ""), 12, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`ID: ${s.student_code ?? "—"}`, 12, 66);
  doc.text(`Enroll: ${s.enrollment_no ?? "—"}`, 12, 78);
  doc.text(`Course: ${s.course?.name ?? "—"}`, 12, 90);
  doc.text(`Branch: ${s.branch?.name ?? "—"}`, 12, 102);
  doc.text(`Mobile: ${s.phone ?? "—"}`, 12, 114);
  doc.text(`Valid till: ${new Date(new Date().getFullYear() + 1, 11, 31).toLocaleDateString("en-IN")}`, 12, 126);
  doc.addImage(qr, "PNG", 176, 52, 54, 54);
  doc.save(`id_card_${s.student_code ?? "student"}.pdf`);
}