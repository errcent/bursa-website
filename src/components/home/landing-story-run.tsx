import type { ReactNode } from "react";

export function LandingStoryRun({
  story,
  next,
}: {
  story: ReactNode;
  next: ReactNode;
}) {
  return (
    <div className="landing-story-run">
      {story}
      <div className="landing-story-run__next">{next}</div>
    </div>
  );
}
