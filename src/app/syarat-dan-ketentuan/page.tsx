import { redirect } from "next/navigation";

/** Legacy alias — canonical ToS is /terms. */
export default function LegacyTermsRedirect() {
  redirect("/terms");
}
