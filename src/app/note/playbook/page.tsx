import { redirect } from "next/navigation";

export const metadata = {
  title: "Playbook · Bursa Note",
  robots: { index: false, follow: false },
};

/** Playbook surface retired - keep route for old bookmarks. */
export default function NotePlaybookPage() {
  redirect("/note/analytics");
}
