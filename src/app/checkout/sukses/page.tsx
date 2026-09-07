import { redirect } from "next/navigation";

/** Checkout sukses dihapus; tautan lama diarahkan ke katalog. */
export default function CheckoutSuccessRedirectPage() {
  redirect("/katalog");
}
