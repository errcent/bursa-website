/** Max journal rows returned by GET /api/note/entries (anti bulk exfiltration). */
export const NOTE_JOURNAL_LIST_MAX = 5_000;

/** Default page size when client omits `limit`. */
export const NOTE_JOURNAL_PAGE_DEFAULT = 1_000;

/** Hard cap rows stored per account (create/import rejected above this). */
export const NOTE_JOURNAL_ACCOUNT_MAX = 25_000;

export const NOTE_TRACK_MAX_PORTFOLIOS = 24;
export const NOTE_TRACK_MAX_TRANSACTIONS = 4_000;

/** Max JSON body for track sync (bytes). */
export const NOTE_TRACK_BODY_MAX_BYTES = 2_000_000;

/** Max CSV upload via import route (slightly above parser cap for multipart overhead). */
export const NOTE_IMPORT_BODY_MAX_BYTES = 220_000;
