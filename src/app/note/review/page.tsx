import { redirect } from "next/navigation";

/** Review merged into Analytics (system drift / edge). */
export default function NoteReviewRedirectPage() {
  redirect("/note/analytics");
}
