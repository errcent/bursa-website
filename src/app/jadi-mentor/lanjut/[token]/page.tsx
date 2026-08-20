import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MentorL2ApplicationForm } from "@/components/mentor-program/mentor-l2-application-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata: Metadata = {
  title: "Lanjutkan aplikasi mentor",
  description: "Portal privat tahap 2 aplikasi mentor Bursanalar.",
  robots: { index: false, follow: false },
};

export default async function MentorL2Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/i.test(token)) notFound();

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="container-page section-spacious max-w-3xl">
          <p className="eyebrow mb-2">Tahap 2</p>
          <h1 className="section-title">Lanjutkan aplikasi mentor</h1>
          <p className="section-copy mt-2 max-w-2xl">
            Portal ini privat. Simpan draf kapan saja. Bukti berupa tautan, bukan unggahan file.
          </p>
          <div className="mt-8">
            <MentorL2ApplicationForm token={token} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
