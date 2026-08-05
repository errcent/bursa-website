/** Auth secret helper — edge/proxy safe (no Prisma imports). */
export function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

  if (secret) return secret;

  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build";

  if (process.env.NODE_ENV === "production" && !isBuildPhase) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required in production");
  }

  return "bursa-build-placeholder-secret-not-for-production";
}
