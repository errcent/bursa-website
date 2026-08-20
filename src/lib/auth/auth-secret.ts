/** Auth secret helper, edge/proxy safe (no Prisma imports). */
export function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build"
  );
}

export function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

  if (secret) return secret;

  if (isNextBuildPhase()) {
    return "bursa-build-placeholder-secret-not-for-production";
  }

  throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required");
}
