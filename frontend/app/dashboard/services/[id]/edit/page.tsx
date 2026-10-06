import ContentForm from "@/components/admin/ContentForm";
import { servicesConfig } from "@/lib/resources";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentForm config={servicesConfig} id={id} />;
}