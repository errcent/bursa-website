import type { Metadata } from "next";

import TersimpanClient from "./tersimpan-client";

export const metadata: Metadata = {
  title: "Tersimpan",
  description: "Kelas, video, playlist, dan mentor yang Anda simpan.",
};

export default function TersimpanPage() {
  return <TersimpanClient />;
}
