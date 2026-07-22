import { getPaymentMethodOption } from "@/lib/payment/methods";

const STORAGE_PREFIX = "bursa-saved-payment-methods";
const CHANGE_EVENT = "bursa-payment-methods-change";

export interface SavedPaymentMethod {
  id: string;
  methodId: string;
  label: string;
  lastFour?: string;
  isDefault: boolean;
  addedAt: string;
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function notifyChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeSavedPaymentMethods(onChange: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function readRaw(userId: string): SavedPaymentMethod[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPaymentMethod[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(userId: string, methods: SavedPaymentMethod[]) {
  if (!isBrowser()) return;
  localStorage.setItem(storageKey(userId), JSON.stringify(methods));
  notifyChange();
}

function demoSeedForEmail(email: string): SavedPaymentMethod[] {
  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (normalized === "demo@bursanalar.com") {
    return [
      {
        id: "pm-demo-gopay",
        methodId: "gopay",
        label: "GoPay ·••• 8821",
        lastFour: "8821",
        isDefault: true,
        addedAt: now,
      },
      {
        id: "pm-demo-va",
        methodId: "va",
        label: "BCA Virtual Account ·••• 4521",
        lastFour: "4521",
        isDefault: false,
        addedAt: now,
      },
    ];
  }

  if (normalized === "learner@test.dev") {
    return [
      {
        id: "pm-learner-gopay",
        methodId: "gopay",
        label: "GoPay ·••• 4410",
        lastFour: "4410",
        isDefault: true,
        addedAt: now,
      },
    ];
  }

  return [];
}

/** Muat metode tersimpan; seed 0–2 demo untuk akun demo bila belum ada data. */
export function getSavedPaymentMethods(userId: string, email?: string): SavedPaymentMethod[] {
  const existing = readRaw(userId);
  if (existing.length > 0) return existing;

  if (!email) return [];

  const seeded = demoSeedForEmail(email);
  if (seeded.length > 0) {
    writeRaw(userId, seeded);
    return seeded;
  }

  return [];
}

export function addSavedPaymentMethod(
  userId: string,
  input: { methodId: string; lastFour?: string }
): SavedPaymentMethod {
  const option = getPaymentMethodOption(input.methodId);
  const methods = readRaw(userId);
  const lastFour = input.lastFour?.replace(/\D/g, "").slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
  const isFirst = methods.length === 0;

  const method: SavedPaymentMethod = {
    id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    methodId: input.methodId,
    label: `${option?.shortLabel ?? input.methodId} ·••• ${lastFour}`,
    lastFour,
    isDefault: isFirst,
    addedAt: new Date().toISOString(),
  };

  writeRaw(userId, [...methods, method]);
  return method;
}

export function setDefaultPaymentMethod(userId: string, methodId: string) {
  const methods = readRaw(userId).map((m) => ({
    ...m,
    isDefault: m.id === methodId,
  }));
  writeRaw(userId, methods);
}

export function removeSavedPaymentMethod(userId: string, methodId: string) {
  const methods = readRaw(userId).filter((m) => m.id !== methodId);
  if (methods.length > 0 && !methods.some((m) => m.isDefault)) {
    methods[0] = { ...methods[0], isDefault: true };
  }
  writeRaw(userId, methods);
}
