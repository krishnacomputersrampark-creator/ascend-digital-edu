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
  course: { id: string; code: string; name: string } | null;
  branch: { id: string; code: string; name: string; city: string | null } | null;
  batch: { id: string; code: string; name: string; timing: string | null } | null;
};

export async function getStudentByUserId(userId: string): Promise<StudentRecord | null> {
  const { data, error } = await supabase
    .from("students")
    .select(
      `id, student_code, enrollment_no, roll_no, full_name, email, phone, photo_url, status, joined_at,
       course:courses(id, code, name),
       branch:branches(id, code, name, city),
       batch:batches(id, code, name, timing)`,
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as StudentRecord) ?? null;
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