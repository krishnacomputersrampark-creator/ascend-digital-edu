import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { StudentForm } from "@/components/erp/students/StudentForm";
import { getStudent, updateStudent } from "@/lib/students.functions";
import type { StudentInput } from "@/lib/students.shared";

export const Route = createFileRoute("/_authenticated/dashboard/students/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Student · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: EditStudentPage,
});

const DOC_BY_KIND: Record<string, keyof StudentInput> = {
  signature: "signature_url",
  aadhaar: "aadhaar_doc_url",
  marksheet: "marksheet_url",
  certificate: "certificate_url",
};

function EditStudentPage() {
  const { id } = useParams({ from: "/_authenticated/dashboard/students/$id/edit" });
  const fetchStudent = useServerFn(getStudent);
  const update = useServerFn(updateStudent);
  const navigate = useNavigate();
  const [initial, setInitial] = useState<Partial<StudentInput> | null>(null);

  useEffect(() => {
    fetchStudent({ data: { id } })
      .then((d: any) => {
        const s = d.student;
        const docs: Partial<StudentInput> = {};
        for (const doc of d.documents ?? []) {
          const key = DOC_BY_KIND[doc.kind];
          if (key) (docs as any)[key] = doc.file_path;
        }
        setInitial({
          full_name: s.full_name ?? "",
          father_name: s.father_name ?? "",
          mother_name: s.mother_name ?? "",
          date_of_birth: s.date_of_birth ?? "",
          gender: s.gender ?? "",
          category: s.category ?? "",
          blood_group: s.blood_group ?? "",
          occupation: s.occupation ?? "",
          aadhaar_number: s.aadhaar_number ?? "",
          phone: s.phone ?? "",
          alternate_mobile: s.alternate_mobile ?? "",
          email: s.email ?? "",
          address: s.address ?? "",
          city: s.city ?? "",
          district: s.district ?? "",
          state: s.state ?? "",
          pincode: s.pincode ?? "",
          guardian_name: s.guardian_name ?? "",
          guardian_phone: s.guardian_phone ?? "",
          emergency_contact: s.emergency_contact ?? "",
          branch_id: s.branch_id ?? "",
          course_id: s.course_id ?? "",
          batch_id: s.batch_id ?? "",
          faculty_id: s.faculty_id ?? "",
          roll_no: s.roll_no ?? "",
          joined_at: s.joined_at ? String(s.joined_at).slice(0, 10) : "",
          status: s.status ?? "active",
          course_fee: Number(s.course_fee ?? 0),
          admission_fee: Number(s.admission_fee ?? 0),
          registration_fee: Number(s.registration_fee ?? 0),
          discount: Number(s.discount ?? 0),
          photo_url: s.photo_url ?? "",
          ...docs,
        });
      })
      .catch((e) => toast.error(e?.message ?? "Could not load student"));
  }, [fetchStudent, id]);

  return (
    <DashboardShell title="Edit Student" subtitle="Update student information. Every change is recorded in the history trail.">
      {initial ? (
        <StudentForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await update({ data: { id, values } });
            toast.success("Student updated.");
            navigate({ to: "/dashboard/students/$id", params: { id } });
          }}
        />
      ) : (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      )}
    </DashboardShell>
  );
}