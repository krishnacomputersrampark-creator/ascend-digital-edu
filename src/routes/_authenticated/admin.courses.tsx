import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/courses")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/courses" }); },
});