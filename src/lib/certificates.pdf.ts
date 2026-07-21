import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { CertificateRow } from "./certificates.repo";
import { CERT_TYPE_LABEL, certificateVerificationUrl } from "./certificates.repo";
import logoAsset from "@/assets/logo.jpg.asset.json";

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateCertificatePdf(cert: CertificateRow) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Outer premium border (Blue + Cyan)
  doc.setDrawColor(6, 116, 174);
  doc.setLineWidth(2);
  doc.rect(6, 6, W - 12, H - 12);
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, W - 20, H - 20);

  // Corner flourishes
  doc.setFillColor(6, 116, 174);
  doc.circle(14, 14, 1.6, "F");
  doc.circle(W - 14, 14, 1.6, "F");
  doc.circle(14, H - 14, 1.6, "F");
  doc.circle(W - 14, H - 14, 1.6, "F");

  // Logo
  const logo = await toDataUrl(logoAsset.url);
  if (logo) {
    try { doc.addImage(logo, "JPEG", 18, 16, 20, 20); } catch {}
  }

  // Institute header
  doc.setTextColor(6, 63, 116);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("KRISHNA COMPUTER CENTER", W / 2, 24, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Institute of Computer Education & Vocational Training", W / 2, 30, { align: "center" });

  // Title
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 40, 34, W / 2 + 40, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(6, 63, 116);
  doc.text("Certificate", W / 2, 50, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(6, 116, 174);
  doc.text(`of ${CERT_TYPE_LABEL[cert.certificate_type]}`, W / 2, 58, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text("This is to certify that", W / 2, 72, { align: "center" });

  // Student name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(6, 63, 116);
  const name = cert.student?.full_name ?? "Student";
  doc.text(name, W / 2, 86, { align: "center" });
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(W / 2 - 70, 90, W / 2 + 70, 90);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const courseName = cert.course?.name ?? "the course";
  const body =
    `bearing Student ID ${cert.student?.student_code ?? "—"}` +
    (cert.student?.roll_no ? ` (Roll No: ${cert.student.roll_no})` : "") +
    ` has successfully completed the course "${courseName}"` +
    (cert.branch?.name ? ` at ${cert.branch.name} branch` : "") +
    (cert.grade || cert.percentage != null
      ? ` with ${cert.grade ? `Grade ${cert.grade}` : ""}${cert.grade && cert.percentage != null ? " and " : ""}${cert.percentage != null ? `${cert.percentage}%` : ""}`
      : "") + ".";
  const wrapped = doc.splitTextToSize(body, W - 80);
  doc.text(wrapped, W / 2, 100, { align: "center" });

  // Certificate details block
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const issueDate = new Date(cert.issue_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const completionDate = cert.completion_date
    ? new Date(cert.completion_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  doc.text(`Certificate No: ${cert.certificate_number}`, 30, H - 40);
  doc.text(`Issue Date: ${issueDate}`, 30, H - 34);
  doc.text(`Completion Date: ${completionDate}`, 30, H - 28);

  // Signature
  doc.setDrawColor(90, 90, 90);
  doc.line(W - 90, H - 30, W - 30, H - 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Authorized Signatory", W - 60, H - 24, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text("Krishna Computer Center", W - 60, H - 19, { align: "center" });

  // Seal (drawn circle)
  doc.setDrawColor(6, 116, 174);
  doc.setLineWidth(0.7);
  doc.circle(W - 130, H - 30, 12);
  doc.setFontSize(7);
  doc.setTextColor(6, 116, 174);
  doc.text("OFFICIAL", W - 130, H - 32, { align: "center" });
  doc.text("SEAL · KCC", W - 130, H - 28, { align: "center" });

  // QR
  const verifyUrl = certificateVerificationUrl(cert.certificate_number);
  try {
    const qr = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 200 });
    doc.addImage(qr, "PNG", W - 46, 16, 24, 24);
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text("Scan to verify", W - 34, 43, { align: "center" });
  } catch {}

  // Footer verification
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Verify: ${verifyUrl}`, W / 2, H - 10, { align: "center" });

  return doc;
}

export async function downloadCertificatePdf(cert: CertificateRow) {
  const doc = await generateCertificatePdf(cert);
  doc.save(`${cert.certificate_number}.pdf`);
}

export async function certificateQrDataUrl(certNumber: string) {
  return QRCode.toDataURL(certificateVerificationUrl(certNumber), { margin: 1, width: 320 });
}