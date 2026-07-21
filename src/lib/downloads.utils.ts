import {
  File, FileText, FileSpreadsheet, Presentation, FileArchive,
  FileImage, FileVideo, FileAudio, FileCode2, BookOpen,
  type LucideIcon,
} from "lucide-react";

export function humanSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const units = ["B","KB","MB","GB"];
  let n = bytes; let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function fileIcon(ext?: string | null): LucideIcon {
  const e = (ext ?? "").toLowerCase().replace(/^\./, "");
  if (["pdf"].includes(e)) return FileText;
  if (["doc","docx","txt","rtf"].includes(e)) return FileText;
  if (["xls","xlsx","csv"].includes(e)) return FileSpreadsheet;
  if (["ppt","pptx","key"].includes(e)) return Presentation;
  if (["zip","rar","7z","tar","gz"].includes(e)) return FileArchive;
  if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(e)) return FileImage;
  if (["mp4","mov","webm","avi","mkv"].includes(e)) return FileVideo;
  if (["mp3","wav","m4a","ogg","flac"].includes(e)) return FileAudio;
  if (["js","ts","tsx","jsx","py","java","cpp","c","cs","html","css","json","xml","yml","yaml","sql"].includes(e)) return FileCode2;
  if (["epub","mobi"].includes(e)) return BookOpen;
  return File;
}

export function extOf(nameOrType?: string | null): string {
  if (!nameOrType) return "";
  if (nameOrType.includes("/")) return nameOrType.split("/").pop() || "";
  return (nameOrType.split(".").pop() || "").toLowerCase();
}

export function isPreviewable(ext: string): "pdf" | "image" | "video" | "audio" | null {
  const e = ext.toLowerCase();
  if (e === "pdf") return "pdf";
  if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(e)) return "image";
  if (["mp4","mov","webm"].includes(e)) return "video";
  if (["mp3","wav","m4a","ogg"].includes(e)) return "audio";
  return null;
}

export function youTubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function downloadBlob(name: string, content: string | Blob, type = "text/csv") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/** Excel-compatible CSV (BOM + UTF-8). Opens directly in Excel with correct chars. */
export function downloadExcelCsv(name: string, rows: Array<Record<string, unknown>>) {
  const csv = toCsv(rows);
  const withBom = "\uFEFF" + csv;
  downloadBlob(name.endsWith(".csv") ? name : `${name}.csv`, withBom, "text/csv;charset=utf-8");
}