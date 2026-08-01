import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid, ModuleStats, EmptyState } from "@/components/erp/ModulePage";
import { Images, FolderPlus, Video, Tags } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/gallery")({
  head: () => ({ meta: [{ title: "Gallery · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: GalleryAdmin,
});

function GalleryAdmin() {
  return (
    <DashboardShell title="Gallery" subtitle="Albums, photos, videos and categories for the public gallery">
      <ModuleStats items={[
        { label: "Albums", value: 0 },
        { label: "Photos", value: 0 },
        { label: "Videos", value: 0 },
        { label: "Categories", value: 0 },
      ]} />
      <ModuleGrid sections={[
        { title: "Albums", body: "Create and organise event albums shown on the public gallery page.", icon: FolderPlus },
        { title: "Photos", body: "Upload, caption and reorder photographs inside each album.", icon: Images },
        { title: "Videos", body: "Attach video links or uploads to any album.", icon: Video },
        { title: "Categories", body: "Group albums by category — events, campus, workshops, results.", icon: Tags },
      ]} />
      <EmptyState title="No albums yet" body="Create your first album to start publishing photos to the website gallery." />
    </DashboardShell>
  );
}