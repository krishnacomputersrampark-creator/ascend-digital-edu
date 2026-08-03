import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { TeacherForm } from "@/components/erp/teachers/TeacherForm";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { saveTeacher, setTeacherAssignments } from "@/lib/teachers.functions";

export const Route = createFileRoute("/_authenticated/dashboard/teachers/new")({
  head: () => ({
    meta: [
      { title: "Add Teacher · KCC ERP" },
      { name: "description", content: "Register a new faculty member with personal, employment and document details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewTeacher,
});

function NewTeacher() {
  const navigate = useNavigate();
  const save = useServerFn(saveTeacher);
  const assign = useServerFn(setTeacherAssignments);
  const getBranches = useServerFn(listBranchesPublic);
  const getCourses = useServerFn(listCoursesPublic);
  const getBatches = useServerFn(listBatchesPublic);

  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBranches().then((r: any) => setBranches(r ?? [])).catch(() => {});
    getCourses().then((r: any) => setCourses(r ?? [])).catch(() => {});
    getBatches({ data: {} } as any).then((r: any) => setBatches(r ?? [])).catch(() => {});
  }, [getBranches, getCourses, getBatches]);

  return (
    <DashboardShell title="Add Teacher" subtitle="Create a new faculty record in five quick steps">
      <TeacherForm
        branches={branches}
        courses={courses}
        batches={batches}
        submitting={busy}
        onCancel={() => navigate({ to: "/dashboard/teachers" })}
        onSubmit={async (values, a) => {
          setBusy(true);
          try {
            const row: any = await save({ data: { values: values as any } });
            if (a.courseIds.length || a.batchIds.length) {
              await assign({ data: { teacherId: row.id, courseIds: a.courseIds, batchIds: a.batchIds } });
            }
            toast.success(`Teacher created — ${row.teacher_id}`);
            navigate({ to: "/dashboard/teachers/$id", params: { id: row.id } });
          } catch (e: any) {
            toast.error(e?.message ?? "Could not save teacher");
          } finally {
            setBusy(false);
          }
        }}
      />
    </DashboardShell>
  );
}