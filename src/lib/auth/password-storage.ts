const HASH_PREFIX = "h1:";

/** One-way hash for prototype localStorage — not for server-side auth. */
export function hashPasswordForStorage(password: string): string {
  if (!password) return "";
  let h = 5381;
  const input = `bursa-local-v1:${password}`;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return `${HASH_PREFIX}${(h >>> 0).toString(36)}`;
}

export function isHashedPassword(value: string): boolean {
  return value.startsWith(HASH_PREFIX);
}

export function verifyStoredPassword(stored: string, input: string): boolean {
  if (!stored) return !input;
  if (isHashedPassword(stored)) {
    return stored === hashPasswordForStorage(input);
  }
  return stored === input;
}

export function normalizeStoredPassword(password: string): string {
  if (!password || isHashedPassword(password)) return password;
  return hashPasswordForStorage(password);
}
