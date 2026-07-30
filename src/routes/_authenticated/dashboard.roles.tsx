import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/dashboard/roles")({
  beforeLoad: () => { throw redirect({ to: "/admin/users" }); },
});
