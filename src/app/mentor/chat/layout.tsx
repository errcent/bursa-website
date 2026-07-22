import { redirect } from "next/navigation";

import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";

export default function MentorChatPageGate({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!KOMUNITAS_ENABLED) {
    redirect("/mentor");
  }

  return children;
}
