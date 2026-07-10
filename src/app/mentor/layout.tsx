import { MentorLayoutShell } from "@/components/mentor/mentor-layout-shell";

export const metadata = {
  title: "Mentor Panel",
};

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return <MentorLayoutShell>{children}</MentorLayoutShell>;
}
