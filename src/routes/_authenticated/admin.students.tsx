import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/students")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/students" }); },
});