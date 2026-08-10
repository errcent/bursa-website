import type { Metadata } from "next";
import Link from "next/link";

import { WaitlistPreferencesForm } from "@/components/waitlist-preferences-form";
import { db } from "@/lib/db";
import { verifyPreferenceSignature } from "@/lib/waitlist/preferences";

export const metadata: Metadata = {
  title: "Preferensi Email | Bursa",
  description: "Kelola topik email dan status langganan waitlist Bursa.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    id?: string;
    sig?: string;
    unsubscribed?: string;
    error?: string;
  }>;
}

export default async function EmailPreferencesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id ?? "";
  const sig = params.sig ?? "";
  let valid = false;
  try {
    valid = verifyPreferenceSignature(id, sig);
  } catch {
    valid = false;
  }

  const entry = valid
    ? await db.waitlistEntry.findUnique({
        where: { id },
        select: {
          email: true,
          status: true,
          wantsProductUpdates: true,
          wantsEducation: true,
          wantsLaunchNews: true,
          experienceLevel: true,
          learningGoal: true,
          marketInterest: true,
        },
      })
    : null;

  const [name = "", domain = ""] = entry?.email.split("@") ?? [];
  const maskedEmail = entry ? `${name.slice(0, 2)}***@${domain}` : "";

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="font-heading text-sm font-semibold tracking-[0.18em] text-primary uppercase"
        >
          Bursa
        </Link>
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-9">
          <h1 className="font-heading text-3xl font-semibold">Preferensi email</h1>
          <p className="mt-2 mb-8 text-muted-foreground">
            Pilih informasi yang memang berguna untukmu. Perubahan berlaku segera untuk email
            lifecycle waitlist.
          </p>

          {entry ? (
            <WaitlistPreferencesForm
              entryId={id}
              signature={sig}
              maskedEmail={maskedEmail}
              initial={{
                wantsProductUpdates: entry.wantsProductUpdates,
                wantsEducation: entry.wantsEducation,
                wantsLaunchNews: entry.wantsLaunchNews,
                experienceLevel: entry.experienceLevel,
                learningGoal: entry.learningGoal,
                marketInterest: entry.marketInterest,
              }}
              initiallyUnsubscribed={
                params.unsubscribed === "1" || entry.status === "UNSUBSCRIBED"
              }
            />
          ) : (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-medium">Tautan preferensi tidak valid atau sudah tidak tersedia.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Gunakan tautan dari email Bursa terbaru atau hubungi tim kami.
              </p>
            </div>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Baca{" "}
          <Link href="/privasi" className="underline underline-offset-2">
            Kebijakan Privasi
          </Link>{" "}
          untuk informasi pengelolaan data.
        </p>
      </div>
    </main>
  );
}

