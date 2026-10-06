import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return <>{children}</>;
}