"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListVideo, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { PlaylistCurriculumCards } from "@/components/playlist/playlist-curriculum-cards";
import { PlaylistDetailHero } from "@/components/playlist/playlist-detail-hero";
import {
  isItemPlayable,
  itemHref,
} from "@/components/playlist/playlist-item-utils";
import { PreviewCatalogNotice } from "@/components/preview-catalog/preview-catalog-notice";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";
import type { PlaylistDetail } from "@/lib/playlist/types";

const playlistFaqs = [
  {
    question: "Apakah semua video dalam playlist bisa langsung ditonton?",
    answer:
      "Tidak selalu. Video tanpa gembok bisa diputar langsung. Video terkunci memerlukan akses ke kelas asalnya.",
  },
  {
    question: "Kenapa ada beberapa mentor dalam satu playlist?",
    answer:
      "Playlist kurasi Bursa menyusun video terbaik dari berbagai kelas dan mentor agar kamu punya jalur belajar yang runut lintas topik.",
  },
];

export function PlaylistDetailView({ slug }: { slug: string }) {
  const { session, isLoading: authLoading } = useAuth();
  const videosSectionRef = useRef<HTMLElement>(null);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        credentials: "include",
        headers: session?.email ? { "x-user-email": session.email } : {},
      });
      if (res.status === 404) {
        setPlaylist(null);
        setError("Playlist tidak ditemukan.");
        return;
      }
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { playlist?: PlaylistDetail };
      setPlaylist(data.playlist ?? null);
    } catch {
      setPlaylist(null);
      setError("Gagal memuat playlist.");
    } finally {
      setLoading(false);
    }
  }, [session?.email, slug]);

  useEffect(() => {
    if (authLoading) return;
    void loadPlaylist();
  }, [authLoading, loadPlaylist]);

  const firstPlayableHref = useMemo(() => {
    if (!playlist?.items.length) return null;
    const first = playlist.items.find((item) => isItemPlayable(item.accessStatus));
    if (!first) return null;
    return itemHref(first, first.accessStatus, Boolean(session));
  }, [playlist?.items, session]);

  const scrollToVideos = useCallback(() => {
    videosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (loading) {
    return (
      <p className="container-page py-16 text-center text-sm text-muted-foreground">
        Memuat playlist…
      </p>
    );
  }

  if (!playlist) {
    return (
      <div className="container-page flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
        <ListVideo className="mb-4 size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{error ?? "Playlist tidak ditemukan."}</p>
        <Button render={<Link href="/katalog" />} variant="outline" className="mt-6">
          Kembali ke katalog
        </Button>
      </div>
    );
  }

  return (
    <>
      <PlaylistDetailHero
        playlist={playlist}
        firstPlayableHref={firstPlayableHref}
        onScrollToList={scrollToVideos}
      />

      <div className="container-page min-w-0 py-6 sm:py-8">
        <PreviewCatalogNotice />
      </div>

      <section
        id="playlist-videos"
        ref={videosSectionRef}
        className="scroll-mt-20 border-t border-border/40 bg-black"
      >
        <div className="container-page min-w-0 py-10 sm:py-14">
          <PlaylistCurriculumCards playlist={playlist} />
        </div>
      </section>

      <div className="container-page min-w-0 py-12 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-12 sm:gap-14">
          <section className="flex min-w-0 gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
            <ShieldCheck className="size-5 shrink-0 text-emerald" />
            <div className="min-w-0">
              <h3 className="font-heading text-sm font-medium text-foreground">
                Transparansi & Pengingat Risiko
              </h3>
              <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
                Playlist ini berisi materi edukasi dari berbagai kelas Bursa. Konten
                berfokus pada konsep dan metodologi analisis pasar, bukan rekomendasi atau
                ajakan beli-jual instrumen tertentu. Seluruh keputusan transaksi tetap ada di
                tangan masing-masing peserta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-5">Pertanyaan Umum</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Accordion>
                <AccordionItem
                  value="faq-preview"
                  className="border-border/60 px-4 last:border-b-0 sm:px-5"
                >
                  <AccordionTrigger className="faq-accordion-trigger">
                    <span className="min-w-0 break-words pr-2 text-left">
                      Apakah playlist ini bisa diakses sekarang?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                    {PREVIEW_CATALOG_COPY.faqPreviewAnswer}
                  </AccordionContent>
                </AccordionItem>
                {playlistFaqs.map((faq, i) => (
                  <AccordionItem
                    key={faq.question}
                    value={`faq-${i}`}
                    className="border-border/60 px-4 last:border-b-0 sm:px-5"
                  >
                    <AccordionTrigger className="faq-accordion-trigger">
                      <span className="min-w-0 break-words pr-2 text-left">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
