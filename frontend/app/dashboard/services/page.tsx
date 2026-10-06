import ContentList from "@/components/admin/ContentList";
import { servicesConfig } from "@/lib/resources";

export default function ServicesPage() {
  return <ContentList config={servicesConfig} />;
}