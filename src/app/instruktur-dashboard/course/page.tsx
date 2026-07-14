import { MentorCourseManager } from "@/components/instruktur-dashboard/mentor-course-manager";

export const metadata = {
  title: "Course Saya — Dashboard Instruktur",
};

export default function InstrukturDashboardCoursePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Course Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit detail dasar dan atur harga kelas. Perubahan harga hanya berlaku untuk transaksi baru.
        </p>
      </div>
      <MentorCourseManager />
    </div>
  );
}
