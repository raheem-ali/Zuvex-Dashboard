import ContentForm from "@/components/admin/ContentForm";
import { publicationsConfig } from "../../../../lib/resources";

export default function NewPublicationPage() {
  return <ContentForm config={publicationsConfig} />;
}