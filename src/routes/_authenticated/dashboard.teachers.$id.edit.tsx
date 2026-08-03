import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { TeacherForm } from "@/components/erp/teachers/TeacherForm";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { getTeacher, saveTeacher, setTeacherAssignments } from "@/lib/teachers.functions";

export const Route = createFileRoute("/_authenticated/dashboard/teachers/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Teacher · KCC ERP" },
      { name: "description", content: "Update faculty personal, employment, assignment and document details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditTeacher,
});

function EditTeacher() {
  const { id } = useParams({ from: "/_authenticated/dashboard/teachers/$id/edit" });
  const navigate = useNavigate();
  const load = useServerFn(getTeacher);
  const save = useServerFn(saveTeacher);
  const assign = useServerFn(setTeacherAssignments);
  const getBranches = useServerFn(listBranchesPublic);
  const getCourses = useServerFn(listCoursesPublic);
  const getBatches = useServerFn(listBatchesPublic);

  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load({ data: { id } }).then(setData).catch((e: any) => toast.error(e?.message ?? "Not found"));
    getBranches().then((r: any) => setBranches(r ?? [])).catch(() => {});
    getCourses().then((r: any) => setCourses(r ?? [])).catch(() => {});
    getBatches({ data: {} } as any).then((r: any) => setBatches(r ?? [])).catch(() => {});
  }, [id, load, getBranches, getCourses, getBatches]);

  if (!data) {
    return (
      <DashboardShell title="Edit Teacher" subtitle="Loading record…">
        <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      </DashboardShell>
    );
  }

  const t = data.teacher;
  const initial = {
    full_name: t.full_name ?? "", father_name: t.father_name ?? "", mother_name: t.mother_name ?? "",
    dob: t.dob ?? "", gender: t.gender ?? "", blood_group: t.blood_group ?? "",
    aadhaar_number: t.aadhaar_number ?? "", pan_number: t.pan_number ?? "",
    mobile: t.mobile ?? "", alternate_mobile: t.alternate_mobile ?? "", email: t.email ?? "",
    address: t.address ?? "", district: t.district ?? "", state: t.state ?? "", pin_code: t.pin_code ?? "",
    qualification: t.qualification ?? "", experience: t.experience ?? "", designation: t.designation ?? "",
    department: t.department ?? "", branch_id: t.branch_id ?? "", joining_date: t.joining_date ?? "",
    salary: Number(t.salary ?? 0), subjects: t.subjects ?? "", working_days: t.working_days ?? "",
    preferred_timings: t.preferred_timings ?? "", status: t.status ?? "active", remarks: t.remarks ?? "",
    photo_url: t.photo_url ?? "", aadhaar_url: t.aadhaar_url ?? "", pan_url: t.pan_url ?? "",
    qualification_url: t.qualification_url ?? "", experience_url: t.experience_url ?? "", signature_url: t.signature_url ?? "",
  };

  return (
    <DashboardShell title={`Edit — ${t.full_name}`} subtitle={`${t.teacher_id} · ${t.employee_code}`}>
      <TeacherForm
        initial={initial as any}
        branches={branches}
        courses={courses}
        batches={batches}
        initialCourseIds={(data.courses ?? []).map((c: any) => c.course_id)}
        initialBatchIds={(data.batches ?? []).map((b: any) => b.batch_id)}
        submitting={busy}
        submitLabel="Update Teacher"
        onCancel={() => navigate({ to: "/dashboard/teachers/$id", params: { id } })}
        onSubmit={async (values, a) => {
          setBusy(true);
          try {
            await save({ data: { id, values: values as any } });
            await assign({ data: { teacherId: id, courseIds: a.courseIds, batchIds: a.batchIds } });
            toast.success("Teacher updated");
            navigate({ to: "/dashboard/teachers/$id", params: { id } });
          } catch (e: any) {
            toast.error(e?.message ?? "Could not update teacher");
          } finally {
            setBusy(false);
          }
        }}
      />
    </DashboardShell>
  );
}