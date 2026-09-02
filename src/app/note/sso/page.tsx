"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { noteSsoStartHref, sanitizeNoteNext } from "@/lib/note/sso-urls";

function NoteSsoInner() {
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const next = sanitizeNoteNext(params.get("next"));
    if (!code) {
      window.location.replace(noteSsoStartHref(next));
      return;
    }
    void fetch("/api/note/sso/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then((res) => {
      window.location.replace(res.ok ? next : noteSsoStartHref(next));
    });
  }, [params]);

  return <p className="p-8 text-sm text-zinc-400">Menyambungkan sesi Note…</p>;
}

export default function NoteSsoPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-zinc-400">Menyambungkan sesi Note…</p>}>
      <NoteSsoInner />
    </Suspense>
  );
}
