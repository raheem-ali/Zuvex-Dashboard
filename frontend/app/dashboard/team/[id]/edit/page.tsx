import ContentForm from "@/components/admin/ContentForm";
import { teamConfig } from "@/lib/resources";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentForm config={teamConfig} id={id} />;
}