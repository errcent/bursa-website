-- Waitlist double opt-in + account email verification tokens.

ALTER TABLE "WaitlistEntry" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationTokenHash" TEXT,
ADD COLUMN "verificationExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "WaitlistEntry_verificationTokenHash_key" ON "WaitlistEntry"("verificationTokenHash");
CREATE INDEX "WaitlistEntry_emailVerifiedAt_idx" ON "WaitlistEntry"("emailVerifiedAt");

CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;