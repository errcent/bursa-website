import { redirect } from "next/navigation";

/** Legacy English path — keep bookmarks/dev tools from landing on a blank 404. */
export default function LoginRedirectPage() {
  redirect("/masuk");
}
