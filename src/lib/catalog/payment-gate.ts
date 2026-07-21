/** Paid checkout via payment gateway — enable when Midtrans/Xendit is live. */
export function isPaidCheckoutEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === "true";
}

export function isFreeCourse(price: number): boolean {
  return price <= 0;
}

export function canPurchaseCourse(price: number): boolean {
  return isFreeCourse(price) || isPaidCheckoutEnabled();
}
