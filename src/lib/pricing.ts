/** Komisi platform indikatif — disepakati internal founder, konsisten di seluruh UI checkout. */
export const PLATFORM_COMMISSION_RATE = 0.25;

export interface CheckoutBreakdown {
  coursePrice: number;
  platformFee: number;
  mentorPayout: number;
  commissionRatePercent: number;
}

export function calculateCheckoutBreakdown(coursePrice: number): CheckoutBreakdown {
  const platformFee = Math.round(coursePrice * PLATFORM_COMMISSION_RATE);
  return {
    coursePrice,
    platformFee,
    mentorPayout: coursePrice - platformFee,
    commissionRatePercent: PLATFORM_COMMISSION_RATE * 100,
  };
}
