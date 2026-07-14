"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { CommissionPreview } from "@/components/instruktur-dashboard/commission-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminCourse } from "@/lib/admin/types";
import { fetchMentorCourses } from "@/lib/mentor/api";
import { updateMentorCourse } from "@/lib/instruktur-dashboard/api";
import { formatRupiah } from "@/lib/mock-data";
import type { Instrument, Level } from "@/lib/types";

const levels: Level[] = ["Pemula", "Menengah", "Mahir"];
const instruments: Instrument[] = ["Saham", "Crypto", "Forex"];

export function MentorCourseManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [level, setLevel] = useState<Level>("Pemula");
  const [instrument, setInstrument] = useState<Instrument>("Saham");
  const [price, setPrice] = useState(49000);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchMentorCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openEdit(course: AdminCourse) {
    setEditingId(course.id);
    setTitle(course.title);
    setShortDescription(course.shortDescription);
    setLevel(course.level);
    setInstrument(course.instrument);
    setPrice(course.price);
    setFormError(null);
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      const updated = await updateMentorCourse(editingId, {
        title,
        shortDescription,
        level,
        instrument,
        price,
      });
      setCourses((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c)));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card p-6 text-center text-sm text-destructive">{error}</div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center gap-4 p-8 text-center">
        <p className="font-heading text-sm font-medium">Belum ada course</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Course pertama Anda dapat dibuat melalui bantuan admin. Setelah tersedia, atur harga dan
          detail dasar di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <article key={course.id} className="surface-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{course.instrument}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                {!course.isPublished && (
                  <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-200">Draft</Badge>
                )}
              </div>
              <h2 className="font-heading text-base font-semibold">{course.title}</h2>
              <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
                {formatRupiah(course.price)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                {editingId === course.id ? "Sedang diedit" : "Edit & Atur Harga"}
              </Button>
              <Button size="sm" variant="ghost" render={<Link href={`/kelas/${course.slug}`} />}>
                Lihat publik
              </Button>
            </div>
          </div>

          {editingId === course.id && (
            <form onSubmit={handleSave} className="mt-4 space-y-4 border-t border-border pt-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Judul kelas</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                  minLength={10}
                  maxLength={120}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Deskripsi singkat</span>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                  minLength={50}
                  maxLength={500}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Level</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Level)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {levels.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Instrumen</span>
                  <select
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value as Instrument)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {instruments.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Harga (IDR)</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min={49000}
                  max={9999999}
                  step={1000}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tabular-nums"
                />
              </label>
              <CommissionPreview price={price} />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan perubahan"}
                </Button>
                {saved && <span className="text-xs text-emerald">Harga diperbarui.</span>}
              </div>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
