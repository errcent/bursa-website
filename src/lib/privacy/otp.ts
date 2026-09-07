import { createHash, randomInt } from "node:crypto";

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtp(email: string, referenceCode: string, otp: string): string {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${referenceCode}:${otp}`)
    .digest("hex");
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
