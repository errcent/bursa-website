import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Founder Admin";

function assertProductionGuard() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    (process.env.DATABASE_URL ?? "").includes("neon.tech");

  if (isProd && process.env.CONFIRM_PRODUCTION_BOOTSTRAP !== "true") {
    throw new Error(
      "Production bootstrap blocked. Set CONFIRM_PRODUCTION_BOOTSTRAP=true deliberately."
    );
  }
}

async function main() {
  assertProductionGuard();

  if (!email || !password) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL dan BOOTSTRAP_ADMIN_PASSWORD wajib diisi.");
  }
  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD minimal 12 karakter.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      nama: name,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
    update: {
      nama: name,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        adminId: user.id,
        email: user.email,
        message: "Admin production siap. Simpan password di password manager.",
      },
      null,
      2
    )
  );
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
