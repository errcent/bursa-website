/** True when legacy x-user-email header bridge is allowed (localStorage prototype). */
export function isPrototypeMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "false") return false;
  return true;
}
