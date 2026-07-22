import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/faculty")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/faculty" }); },
});