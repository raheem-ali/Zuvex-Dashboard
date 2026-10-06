import ContentForm from "@/components/admin/ContentForm";
import { teamConfig } from "@/lib/resources";

export default function NewTeamMemberPage() {
  return <ContentForm config={teamConfig} />;
}