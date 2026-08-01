import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { StudentForm } from "@/components/erp/students/StudentForm";
import { createStudent } from "@/lib/students.functions";

export const Route = createFileRoute("/_authenticated/dashboard/students/new")({
  head: () => ({ meta: [{ title: "Add Student · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: NewStudentPage,
});

function NewStudentPage() {
  const create = useServerFn(createStudent);
  const navigate = useNavigate();

  return (
    <DashboardShell title="Add Student" subtitle="Register a new student in five quick steps.">
      <StudentForm
        submitLabel="Create student"
        onSubmit={async (values) => {
          const created: any = await create({ data: values });
          toast.success(`Student created — ${created.student_code} / ${created.admission_number}`);
          navigate({ to: "/dashboard/students/$id", params: { id: created.id } });
        }}
      />
    </DashboardShell>
  );
}