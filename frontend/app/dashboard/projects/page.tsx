import ContentList from "@/components/admin/ContentList";
import { projectsConfig } from "@/lib/resources";

export default function ProjectsPage() {
  return <ContentList config={projectsConfig} />;
}