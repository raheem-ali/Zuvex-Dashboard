import ContentList from "@/components/admin/ContentList";
import { publicationsConfig } from "../../../lib/resources";

export default function PublicationsPage() {
  return <ContentList config={publicationsConfig} />;
}