import ContentForm from "@/components/admin/ContentForm";
import { servicesConfig } from "@/lib/resources";

export default function NewServicePage() {
  return <ContentForm config={servicesConfig} />;
}