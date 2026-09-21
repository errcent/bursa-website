import {
  JOURNAL_DB_IDB_NAME,
  JOURNAL_DB_IDB_VERSION,
  JOURNAL_DB_STORAGE_KEY,
  type JournalDbRow,
  type JournalDbSchema,
} from "./types";

const STORE_META = "meta";
const STORE_ROWS = "rows";
const STORE_BLOBS = "blobs";

type MetaRecord = { key: string; value: unknown };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(JOURNAL_DB_IDB_NAME, JOURNAL_DB_IDB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORE_ROWS)) db.createObjectStore(STORE_ROWS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_BLOBS)) db.createObjectStore(STORE_BLOBS, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IDB tx aborted"));
  });
}

export async function idbGetSchema(): Promise<JournalDbSchema | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).get("schema");
    req.onsuccess = () => {
      const rec = req.result as MetaRecord | undefined;
      resolve((rec?.value as JournalDbSchema) ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutSchema(schema: JournalDbSchema): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_META, "readwrite");
  tx.objectStore(STORE_META).put({ key: "schema", value: schema } satisfies MetaRecord);
  localStorage.setItem(JOURNAL_DB_STORAGE_KEY, JSON.stringify({ schemaUpdatedAt: schema.updatedAt }));
  await txDone(tx);
}

export async function idbListRows(): Promise<JournalDbRow[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ROWS, "readonly");
    const req = tx.objectStore(STORE_ROWS).getAll();
    req.onsuccess = () => resolve((req.result as JournalDbRow[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutRow(row: JournalDbRow): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_ROWS, "readwrite");
  tx.objectStore(STORE_ROWS).put(row);
  await txDone(tx);
}

export async function idbPutRows(rows: JournalDbRow[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_ROWS, "readwrite");
  const store = tx.objectStore(STORE_ROWS);
  for (const row of rows) store.put(row);
  await txDone(tx);
}

export async function idbDeleteRow(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_ROWS, "readwrite");
  tx.objectStore(STORE_ROWS).delete(id);
  await txDone(tx);
}

export async function idbClearRows(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_ROWS, "readwrite");
  tx.objectStore(STORE_ROWS).clear();
  await txDone(tx);
}

export type BlobRecord = { id: string; blob: Blob; name: string; mime: string };

export async function idbPutBlob(rec: BlobRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_BLOBS, "readwrite");
  tx.objectStore(STORE_BLOBS).put(rec);
  await txDone(tx);
}

export async function idbGetBlob(id: string): Promise<BlobRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, "readonly");
    const req = tx.objectStore(STORE_BLOBS).get(id);
    req.onsuccess = () => resolve((req.result as BlobRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbDeleteBlob(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_BLOBS, "readwrite");
  tx.objectStore(STORE_BLOBS).delete(id);
  await txDone(tx);
}

export async function idbGetSeedFlag(): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).get("seeded");
    req.onsuccess = () => resolve(Boolean((req.result as MetaRecord | undefined)?.value));
    req.onerror = () => reject(req.error);
  });
}

export async function idbSetSeedFlag(value: boolean): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_META, "readwrite");
  tx.objectStore(STORE_META).put({ key: "seeded", value } satisfies MetaRecord);
  await txDone(tx);
}

export async function idbWipeAll(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([STORE_META, STORE_ROWS, STORE_BLOBS], "readwrite");
  tx.objectStore(STORE_META).clear();
  tx.objectStore(STORE_ROWS).clear();
  tx.objectStore(STORE_BLOBS).clear();
  localStorage.removeItem(JOURNAL_DB_STORAGE_KEY);
  await txDone(tx);
}
