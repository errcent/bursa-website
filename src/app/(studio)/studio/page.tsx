import { notFound } from "next/navigation";

import { StudioDashboard } from "@/components/image-studio/studio-dashboard";
import { isImageStudioEnabled } from "@/lib/image-studio/config";

export const metadata = {
  title: "Image Studio",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  if (!isImageStudioEnabled()) {
    notFound();
  }

  return <StudioDashboard />;
}
