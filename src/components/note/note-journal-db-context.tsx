"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createBagasDefaultSchema,
  ensureBagasSeed,
  idbDeleteBlob,
  idbDeleteRow,
  idbGetBlob,
  idbGetSchema,
  idbListRows,
  idbPutBlob,
  idbPutRow,
  idbPutSchema,
  migrateSchemaHandyViews,
  newPropertyId,
  newRowId,
  newViewId,
  projectRowsToJournalEntries,
  type JournalDbRow,
  type JournalDbSchema,
  type JournalDbView,
  type JournalFileRef,
  type JournalPropertyDef,
  type JournalPropType,
} from "@/lib/note/journal-db";
import type { JournalEntry } from "@/lib/note/types";

type JournalDbState = {
  ready: boolean;
  error: string | null;
  schema: JournalDbSchema | null;
  rows: JournalDbRow[];
  activeViewId: string | null;
  projectedEntries: JournalEntry[];
  refresh: () => Promise<void>;
  setActiveViewId: (id: string) => void;
  updateSchema: (schema: JournalDbSchema) => Promise<void>;
  upsertRow: (row: JournalDbRow) => Promise<void>;
  deleteRow: (id: string) => Promise<void>;
  addProperty: (type: JournalPropType, name?: string) => Promise<void>;
  renameProperty: (id: string, name: string) => Promise<void>;
  hideProperty: (id: string, hidden: boolean) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addView: (name?: string) => Promise<void>;
  updateView: (view: JournalDbView) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
  createEmptyRow: () => Promise<JournalDbRow>;
  uploadFileToRow: (rowId: string, propId: string, file: File) => Promise<void>;
  getBlobUrl: (fileId: string) => Promise<string | null>;
  reseedBagas: () => Promise<void>;
};

const Ctx = createContext<JournalDbState | null>(null);
const APEX_LOCAL = "local-demo";

async function loadAll(): Promise<{ schema: JournalDbSchema; rows: JournalDbRow[] }> {
  await ensureBagasSeed(false);
  let schema = await idbGetSchema();
  if (!schema) {
    schema = createBagasDefaultSchema();
    await idbPutSchema(schema);
  } else {
    const migrated = migrateSchemaHandyViews(schema);
    if (migrated !== schema) {
      schema = migrated;
      await idbPutSchema(schema);
    }
  }
  const rows = await idbListRows();
  return { schema, rows };
}

export function NoteJournalDbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<JournalDbSchema | null>(null);
  const [rows, setRows] = useState<JournalDbRow[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [blobUrlCache] = useState(() => new Map<string, string>());

  const refresh = useCallback(async () => {
    try {
      const next = await loadAll();
      setSchema(next.schema);
      setRows(next.rows);
      setActiveViewId((cur) => cur ?? next.schema.defaultViewId);
      setError(null);
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load journal DB");
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      for (const url of blobUrlCache.values()) URL.revokeObjectURL(url);
      blobUrlCache.clear();
    };
  }, [refresh, blobUrlCache]);

  const projectedEntries = useMemo(
    () => projectRowsToJournalEntries(rows, APEX_LOCAL),
    [rows]
  );

  const updateSchema = useCallback(async (next: JournalDbSchema) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    await idbPutSchema(stamped);
    setSchema(stamped);
  }, []);

  const upsertRow = useCallback(async (row: JournalDbRow) => {
    const next = { ...row, updatedAt: new Date().toISOString() };
    await idbPutRow(next);
    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === next.id);
      if (i < 0) return [next, ...prev];
      const copy = [...prev];
      copy[i] = next;
      return copy;
    });
  }, []);

  const deleteRow = useCallback(async (id: string) => {
    await idbDeleteRow(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addProperty = useCallback(
    async (type: JournalPropType, name?: string) => {
      if (!schema) return;
      const id = newPropertyId(type);
      const order = schema.properties.reduce((m, p) => Math.max(m, p.order), -1) + 1;
      const property: JournalPropertyDef = {
        id,
        name: name ?? (type === "title" ? "Title" : type),
        type,
        order,
        ...(type === "select" || type === "multi_select"
          ? { options: [{ id: "opt1", label: "Option 1" }] }
          : {}),
        ...(type === "formula" ? { formula: { expression: "" } } : {}),
        ...(type === "relation" ? { relation: { target: "self" as const } } : {}),
        ...(type === "rollup"
          ? {
              rollup: {
                relationPropId: "",
                targetPropId: "",
                aggregation: "count" as const,
              },
            }
          : {}),
      };
      const views = schema.views.map((v) => ({
        ...v,
        visiblePropertyIds: [...v.visiblePropertyIds, id],
      }));
      await updateSchema({
        ...schema,
        properties: [...schema.properties, property],
        views,
      });
    },
    [schema, updateSchema]
  );

  const renameProperty = useCallback(
    async (id: string, name: string) => {
      if (!schema) return;
      await updateSchema({
        ...schema,
        properties: schema.properties.map((p) => (p.id === id ? { ...p, name } : p)),
      });
    },
    [schema, updateSchema]
  );

  const hideProperty = useCallback(
    async (id: string, hidden: boolean) => {
      if (!schema) return;
      await updateSchema({
        ...schema,
        properties: schema.properties.map((p) => (p.id === id ? { ...p, hidden } : p)),
      });
    },
    [schema, updateSchema]
  );

  const deleteProperty = useCallback(
    async (id: string) => {
      if (!schema) return;
      const target = schema.properties.find((p) => p.id === id);
      if (!target || target.reserved) return;
      await updateSchema({
        ...schema,
        properties: schema.properties.filter((p) => p.id !== id),
        views: schema.views.map((v) => ({
          ...v,
          visiblePropertyIds: v.visiblePropertyIds.filter((x) => x !== id),
          filters: v.filters.filter((f) => f.propertyId !== id),
          sorts: v.sorts.filter((s) => s.propertyId !== id),
          groupBy: v.groupBy === id ? null : v.groupBy,
        })),
      });
      setRows((prev) =>
        prev.map((row) => {
          if (!(id in row.values)) return row;
          const values = { ...row.values };
          delete values[id];
          return { ...row, values, updatedAt: new Date().toISOString() };
        })
      );
      const all = await idbListRows();
      for (const row of all) {
        if (id in row.values) {
          const values = { ...row.values };
          delete values[id];
          await idbPutRow({ ...row, values, updatedAt: new Date().toISOString() });
        }
      }
    },
    [schema, updateSchema]
  );

  const addView = useCallback(
    async (name?: string) => {
      if (!schema) return;
      const id = newViewId();
      const view: JournalDbView = {
        id,
        name: name ?? `View ${schema.views.length + 1}`,
        type: "table",
        filters: [],
        sorts: [],
        groupBy: null,
        visiblePropertyIds: schema.properties.filter((p) => !p.hidden).map((p) => p.id),
      };
      await updateSchema({
        ...schema,
        views: [...schema.views, view],
        defaultViewId: schema.defaultViewId || id,
      });
      setActiveViewId(id);
    },
    [schema, updateSchema]
  );

  const updateView = useCallback(
    async (view: JournalDbView) => {
      if (!schema) return;
      await updateSchema({
        ...schema,
        views: schema.views.map((v) => (v.id === view.id ? view : v)),
      });
    },
    [schema, updateSchema]
  );

  const deleteView = useCallback(
    async (id: string) => {
      if (!schema || schema.views.length <= 1) return;
      const views = schema.views.filter((v) => v.id !== id);
      const defaultViewId =
        schema.defaultViewId === id ? views[0]!.id : schema.defaultViewId;
      await updateSchema({ ...schema, views, defaultViewId });
      setActiveViewId((cur) => (cur === id ? defaultViewId : cur));
    },
    [schema, updateSchema]
  );

  const createEmptyRow = useCallback(async () => {
    const now = new Date().toISOString();
    const row: JournalDbRow = {
      id: newRowId(),
      createdAt: now,
      updatedAt: now,
      values: {},
    };
    await upsertRow(row);
    return row;
  }, [upsertRow]);

  const uploadFileToRow = useCallback(
    async (rowId: string, propId: string, file: File) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const fileId = `file_${newRowId()}`;
      await idbPutBlob({ id: fileId, blob: file, name: file.name, mime: file.type || "application/octet-stream" });
      const ref: JournalFileRef = {
        storage: "idb",
        id: fileId,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      };
      const prev = Array.isArray(row.values[propId]) ? (row.values[propId] as JournalFileRef[]) : [];
      await upsertRow({ ...row, values: { ...row.values, [propId]: [...prev, ref] } });
    },
    [rows, upsertRow]
  );

  const getBlobUrl = useCallback(
    async (fileId: string) => {
      const cached = blobUrlCache.get(fileId);
      if (cached) return cached;
      const rec = await idbGetBlob(fileId);
      if (!rec) return null;
      const url = URL.createObjectURL(rec.blob);
      blobUrlCache.set(fileId, url);
      return url;
    },
    [blobUrlCache]
  );

  const reseedBagas = useCallback(async () => {
    await ensureBagasSeed(true);
    await refresh();
  }, [refresh]);

  const value: JournalDbState = {
    ready,
    error,
    schema,
    rows,
    activeViewId,
    projectedEntries,
    refresh,
    setActiveViewId,
    updateSchema,
    upsertRow,
    deleteRow,
    addProperty,
    renameProperty,
    hideProperty,
    deleteProperty,
    addView,
    updateView,
    deleteView,
    createEmptyRow,
    uploadFileToRow,
    getBlobUrl,
    reseedBagas,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNoteJournalDb() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNoteJournalDb must be used within NoteJournalDbProvider");
  return ctx;
}

// silence unused import warning for idbDeleteBlob until trash cleans files
void idbDeleteBlob;
