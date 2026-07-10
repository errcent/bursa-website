import { CurriculumManager } from "@/components/admin/curriculum-manager";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCourseCurriculumPage({ params }: PageProps) {
  const { id } = await params;
  return <CurriculumManager courseId={id} />;
}
