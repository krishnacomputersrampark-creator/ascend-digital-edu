import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/reports")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/reports" }); },
});