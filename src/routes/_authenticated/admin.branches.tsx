import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/branches")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/branches" }); },
});