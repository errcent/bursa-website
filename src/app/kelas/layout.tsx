import { CourseDetailBackButton } from "@/components/course-detail-back-button";

export default function KelasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CourseDetailBackButton />
      {children}
    </>
  );
}
