-- Revoked web session JTIs (logout).

CREATE TABLE "RevokedWebSession" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedWebSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevokedWebSession_jti_key" ON "RevokedWebSession"("jti");
CREATE INDEX "RevokedWebSession_expiresAt_idx" ON "RevokedWebSession"("expiresAt");