import { DeveloperLayoutShell } from "@/components/developer/developer-layout-shell";

export const metadata = {
  title: "Developer",
};

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperLayoutShell>{children}</DeveloperLayoutShell>;
}
