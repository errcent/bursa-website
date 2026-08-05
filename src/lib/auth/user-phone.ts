import {
  decryptField,
  encryptField,
  hashPhoneForLookup,
} from "@/lib/crypto/field-encryption";

export function decryptUserPhone(phone: string | null): string | null {
  if (!phone) return null;
  return decryptField(phone);
}

export function encryptUserPhone(phone: string): { phone: string; phoneHash: string } {
  const normalized = phone.trim();
  return {
    phone: encryptField(normalized),
    phoneHash: hashPhoneForLookup(normalized),
  };
}
