import { requireServerSession } from "@/lib/auth/server-page-guard";

export default async function DeveloperDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerSession(["ADMIN", "DEVELOPER"], "/developer/docs");
  return children;
}
