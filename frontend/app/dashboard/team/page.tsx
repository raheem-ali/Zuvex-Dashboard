import ContentList from "@/components/admin/ContentList";
import { teamConfig } from "@/lib/resources";

export default function TeamPage() {
  return <ContentList config={teamConfig} />;
}