"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NoteSsoInner() {
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const next = params.get("next") || "/note";
    if (!code) {
      window.location.replace("/api/note/sso/start");
      return;
    }
    void fetch("/api/note/sso/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then((res) => {
      window.location.replace(res.ok ? next : "/api/note/sso/start");
    });
  }, [params]);

  return <p className="p-8 text-sm text-muted-foreground">Menyambungkan sesi Note…</p>;
}

export default function NoteSsoPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Menyambungkan sesi Note…</p>}>
      <NoteSsoInner />
    </Suspense>
  );
}
