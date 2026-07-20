import { supabase } from "@/integrations/supabase/client";

export type StudentRecord = {
  id: string;
  student_code: string;
  enrollment_no: string;
  roll_no: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  photo_url: string | null;
  status: string;
  joined_at: string;
  gender: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  occupation: string | null;
  aadhaar_number: string | null;
  alternate_mobile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  emergency_contact: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  admission_no: string | null;
  course: { id: string; code: string; name: string } | null;
  branch: { id: string; code: string; name: string; city: string | null } | null;
  batch: { id: string; code: string; name: string; timing: string | null } | null;
};

export async function getStudentByUserId(userId: string): Promise<StudentRecord | null> {
  const { data, error } = await supabase
    .from("students")
    .select(
      `id, student_code, enrollment_no, roll_no, full_name, email, phone, photo_url, status, joined_at,
       gender, date_of_birth, blood_group, occupation, aadhaar_number, alternate_mobile,
       address, city, state, pincode, emergency_contact, guardian_name, guardian_phone,
       admission:admissions!students_admission_id_fkey(admission_no),
       course:courses(id, code, name),
       branch:branches(id, code, name, city),
       batch:batches(id, code, name, timing)`,
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { admission, ...rest } = data as any;
  return { ...rest, admission_no: admission?.admission_no ?? null } as StudentRecord;
}

export type EditableStudentProfile = {
  phone: string;
  alternate_mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  emergency_contact: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  blood_group: string | null;
  occupation: string | null;
  photo_url: string | null;
};

export async function updateMyStudentProfile(payload: EditableStudentProfile) {
  const args = {
    _phone: payload.phone,
    _alternate_mobile: payload.alternate_mobile,
    _email: payload.email,
    _address: payload.address,
    _city: payload.city,
    _state: payload.state,
    _pincode: payload.pincode,
    _emergency_contact: payload.emergency_contact,
    _guardian_name: payload.guardian_name,
    _guardian_phone: payload.guardian_phone,
    _blood_group: payload.blood_group,
    _occupation: payload.occupation,
    _photo_url: payload.photo_url,
  } as any;
  const { data, error } = await (supabase.rpc as any)("update_my_student_profile", args);
  if (error) throw error;
  return data;
}

/** % of profile completeness across key fields. */
export function calcProfileCompletion(s: StudentRecord | null): number {
  if (!s) return 0;
  const fields: Array<unknown> = [
    s.full_name, s.phone, s.email, s.date_of_birth, s.gender,
    s.address, s.city, s.state, s.pincode, s.blood_group,
    s.guardian_name, s.guardian_phone, s.emergency_contact, s.photo_url,
  ];
  const filled = fields.filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

/** Upload profile photo to student-photos bucket at `<uid>/avatar.<ext>` and return signed URL path. */
export async function uploadStudentPhoto(userId: string, file: Blob, ext = "jpg"): Promise<string> {
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("student-photos")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

export async function getPhotoSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from("student-photos").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export type NotificationRecord = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  created_at: string;
};

export async function listMyNotifications(limit = 10): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, description, type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}