"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { bookMentorSlot, fetchMentorSlots } from "@/lib/sessions/api";
import {
  formatSlotDate,
  formatSlotRange,
} from "@/lib/sessions/server";
import type { AvailabilitySlot } from "@/lib/sessions/types";

type Props = {
  slug: string;
  mentorName: string;
  sessionPrice?: string;
};

export function SessionBookingPage({ slug, mentorName, sessionPrice }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [availableFor1on1, setAvailableFor1on1] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AvailabilitySlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMentorSlots(slug);
      setSlots(data.slots);
      setAvailableFor1on1(data.mentor.availableFor1on1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat jadwal.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBook(slot: AvailabilitySlot) {
    if (!session) {
      setError("Masuk terlebih dahulu untuk membooking sesi.");
      return;
    }
    setBookingId(slot.id);
    setError(null);
    try {
      const result = await bookMentorSlot(slug, slot.id);
      setConfirmed(result.slot);
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membooking.");
    } finally {
      setBookingId(null);
    }
  }

  const mentorFirstName = mentorName.split(",")[0];

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="container-page py-10 sm:py-14">
          <Link
            href={`/instruktur/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke profil {mentorFirstName}
          </Link>

          <div className="mt-6 max-w-2xl">
            <h1 className="page-hero-title text-2xl sm:text-3xl">Lihat Jadwal Tersedia</h1>
            <p className="section-copy mt-2">
              Sesi 1-on-1 dengan {mentorName}
              {sessionPrice ? ` · ${sessionPrice}` : ""}
            </p>
          </div>

          {confirmed && (
            <div className="surface-card mt-8 max-w-2xl border-emerald/30 bg-emerald/5 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald" />
                <div>
                  <h2 className="font-heading text-lg font-semibold text-emerald">
                    Sesi berhasil dibooking!
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatSlotDate(confirmed.startAt)} ·{" "}
                    {formatSlotRange(confirmed.startAt, confirmed.endAt)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Konfirmasi detail (link meeting, dll.) akan dikirim melalui email. Pembayaran
                    ditahan hingga sesi selesai.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    render={<Link href={`/instruktur/${slug}`} />}
                  >
                    Kembali ke profil mentor
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 max-w-2xl rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
              {!session && (
                <Button className="mt-3" size="sm" render={<Link href="/masuk" />}>
                  Masuk
                </Button>
              )}
            </div>
          )}

          {loading ? (
            <div className="mt-10 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat jadwal...
            </div>
          ) : !availableFor1on1 ? (
            <div className="surface-card mt-8 max-w-2xl p-6 text-center">
              <Calendar className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Mentor ini belum membuka sesi 1-on-1. Cek kembali nanti atau pilih kelas mentor
                terlebih dahulu.
              </p>
              <Button className="mt-4" render={<Link href={`/instruktur/${slug}`} />}>
                Lihat kelas {mentorFirstName}
              </Button>
            </div>
          ) : slots.length === 0 ? (
            <div className="surface-card mt-8 max-w-2xl p-6 text-center">
              <Calendar className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Belum ada slot tersedia saat ini. Tim kami sedang mengatur jadwal — silakan cek
                kembali dalam beberapa hari.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid max-w-2xl gap-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{formatSlotDate(slot.startAt)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSlotRange(slot.startAt, slot.endAt)}
                    </p>
                    {slot.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{slot.notes}</p>
                    )}
                  </div>
                  <Button
                    className="btn-primary shrink-0"
                    disabled={bookingId === slot.id}
                    onClick={() => handleBook(slot)}
                  >
                    {bookingId === slot.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Membooking...
                      </>
                    ) : (
                      "Booking Sesi"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
