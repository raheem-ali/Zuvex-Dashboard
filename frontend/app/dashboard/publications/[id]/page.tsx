import ContentForm from "@/components/admin/ContentForm";
import { publicationsConfig } from "../../../../lib/resources";

export default async function EditPublicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentForm config={publicationsConfig} id={id} />;
}