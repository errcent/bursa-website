import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function prismaClientMessage(error: Error): string | null {
  const msg = error.message;
  if (
    msg.includes("Unknown arg") ||
    msg.includes("Unknown field") ||
    msg.includes("Unknown enum") ||
    msg.includes("does not exist on the") ||
    msg.includes("Invalid `prisma")
  ) {
    return `Skema Prisma tidak cocok: ${msg.slice(0, 240)}. Restart Next setelah menjalankan prisma generate / migrate.`;
  }
  return null;
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.issues.map((i) => i.message).join(", "), 422);
  }

  console.error(error);

  if (error instanceof Prisma.PrismaClientValidationError) {
    const hint = prismaClientMessage(error);
    return jsonError(
      hint ??
        "Permintaan tidak valid ke database. Periksa field/enum Prisma (mis. MessageType).",
      400
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2022") {
      return jsonError(
        "Kolom database belum ada setelah migrasi. Jalankan prisma migrate lalu restart server.",
        500
      );
    }
    if (error.code === "P2003") {
      return jsonError(
        "Referensi tidak valid (user/cabang/pesan balasan). Muat ulang halaman lalu coba lagi.",
        400
      );
    }
    if (error.code === "P2002") {
      return jsonError("Data duplikat.", 409);
    }
    if (process.env.NODE_ENV === "development") {
      return jsonError(`Database error (${error.code}): ${error.message.slice(0, 240)}`, 500);
    }
  }

  if (error instanceof Error) {
    const hint = prismaClientMessage(error);
    if (hint) return jsonError(hint, 500);
  }

  return jsonError("Internal server error", 500);
}
