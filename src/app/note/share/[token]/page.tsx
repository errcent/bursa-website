import { notFound } from "next/navigation";

/**
 * Mentor share page — read-only journal summary.
 * Route: /note/share/[token]
 *
 * For now, this is a placeholder. The actual share data would be
 * fetched from a server-side store keyed by the token. Since Note is
 * local-first, the share link encodes a token that the journal
 * owner's browser can serve via a peer-to-peer mechanism (future).
 *
 * Current: shows a public landing explaining the share concept.
 */

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 5) return notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4">
        <h1 className="font-heading text-xl font-semibold text-zinc-100">
          Mentor View
        </h1>
        <p className="text-sm text-zinc-400">
          This is a mentor share link for a Bursa Note journal. The journal
          owner has shared a read-only summary of their trading performance.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 space-y-2">
          <p className="text-xs text-zinc-500">Share token</p>
          <code className="text-sm text-zinc-300">{token}</code>
        </div>
        <p className="text-xs text-zinc-500">
          The full mentor view (PnL, win rate, recent trades) requires the
          journal owner to be online for peer-to-peer data sync. Ask the
          journal owner to open their Bursa Note app to enable live sharing.
        </p>
      </div>
    </div>
  );
}
