import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/verify-certificate")({
  beforeLoad: () => { throw redirect({ to: "/certificate-verification" }); },
});