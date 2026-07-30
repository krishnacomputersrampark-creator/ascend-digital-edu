import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listCoursesTool from "./tools/list-courses";
import searchStudentsTool from "./tools/search-students";
import studentOverviewTool from "./tools/student-overview";
import verifyCertificateTool from "./tools/verify-certificate";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "krishna-digital-academy",
  title: "Krishna Digital Academy",
  version: "0.1.0",
  instructions:
    "Tools for the Krishna Computer Center institute ERP. Every call acts as the signed-in user, so results respect their role and branch. Use `whoami` to see who is connected, `list_courses` for the course catalogue, `search_students` to find a student, `student_overview` for fees/attendance/results/certificates of one student, and `verify_certificate` to validate a certificate number.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listCoursesTool, searchStudentsTool, studentOverviewTool, verifyCertificateTool],
});
