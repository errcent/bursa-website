export type PaymentMethodKind = "ewallet" | "bank_transfer" | "card" | "qris";

export interface PaymentMethodOption {
  id: string;
  label: string;
  shortLabel: string;
  kind: PaymentMethodKind;
  description: string;
}

/** Metode pembayaran Indonesia — selaras dengan checkout & integrasi Midtrans (P3). */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: "gopay",
    label: "GoPay",
    shortLabel: "GoPay",
    kind: "ewallet",
    description: "E-wallet GoPay",
  },
  {
    id: "ovo",
    label: "OVO",
    shortLabel: "OVO",
    kind: "ewallet",
    description: "E-wallet OVO",
  },
  {
    id: "dana",
    label: "DANA",
    shortLabel: "DANA",
    kind: "ewallet",
    description: "E-wallet DANA",
  },
  {
    id: "va",
    label: "Transfer Virtual Account",
    shortLabel: "Bank Transfer",
    kind: "bank_transfer",
    description: "BCA, Mandiri, BNI, BRI, dan bank lainnya",
  },
  {
    id: "card",
    label: "Kartu Kredit / Debit",
    shortLabel: "Kartu",
    kind: "card",
    description: "Visa, Mastercard, JCB",
  },
  {
    id: "qris",
    label: "QRIS",
    shortLabel: "QRIS",
    kind: "qris",
    description: "Scan QR di aplikasi bank atau e-wallet",
  },
];

export function getPaymentMethodOption(id: string): PaymentMethodOption | undefined {
  return PAYMENT_METHOD_OPTIONS.find((m) => m.id === id);
}
