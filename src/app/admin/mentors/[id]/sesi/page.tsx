import { redirect } from "next/navigation";

/** Manajemen jadwal 1-on-1 dihapus; tautan lama diarahkan ke daftar mentor. */
export default function AdminMentorSessionsRedirectPage() {
  redirect("/admin/mentors");
}
