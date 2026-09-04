import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return <Outlet />;
}
