import type { MetadataRoute } from "next";

/**
 * PWA manifest for Bursa Note.
 * Enables: home screen install, offline app shell, push notifications.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bursa Note — Trading Journal",
    short_name: "Bursa Note",
    description:
      "Jurnal trading lokal-first: paste trade, auto R-multiple, insight satu kalimat, IDX native. Gratis.",
    start_url: "/note",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#09090b",
    theme_color: "#09090b",
    scope: "/note",
    icons: [
      {
        src: "/icon-note-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-note-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["finance", "productivity", "business"],
    shortcuts: [
      {
        name: "Log trade",
        short_name: "Log",
        url: "/note/baru",
        icons: [{ src: "/icon-note-192.png", sizes: "192x192" }],
      },
      {
        name: "Overview",
        short_name: "Overview",
        url: "/note",
        icons: [{ src: "/icon-note-192.png", sizes: "192x192" }],
      },
      {
        name: "Journal",
        short_name: "Journal",
        url: "/note/jurnal",
        icons: [{ src: "/icon-note-192.png", sizes: "192x192" }],
      },
    ],
  };
}
