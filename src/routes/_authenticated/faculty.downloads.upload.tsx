import { createFileRoute } from "@tanstack/react-router";
import { UploadPage } from "./admin.downloads.upload";

export const Route = createFileRoute("/_authenticated/faculty/downloads/upload")({
  head: () => ({ meta: [{ title: "Upload Material · KCC Faculty" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string | undefined) ?? undefined }),
  component: () => <UploadPage mode="faculty" />,
});