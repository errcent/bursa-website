export const MIN_COURSE_PRICE_IDR = 49_000;
export const MAX_COURSE_PRICE_IDR = 9_999_999;
export const PRICE_STEP_IDR = 1_000;

export function validateCoursePriceIdr(price: number): string | null {
  if (!Number.isFinite(price) || !Number.isInteger(price)) {
    return "Harga harus bilangan bulat.";
  }
  if (price < MIN_COURSE_PRICE_IDR) {
    return `Harga minimal Rp ${MIN_COURSE_PRICE_IDR.toLocaleString("id-ID")}.`;
  }
  if (price > MAX_COURSE_PRICE_IDR) {
    return `Harga maksimal Rp ${MAX_COURSE_PRICE_IDR.toLocaleString("id-ID")}.`;
  }
  if (price % PRICE_STEP_IDR !== 0) {
    return "Harga harus kelipatan Rp 1.000.";
  }
  return null;
}
