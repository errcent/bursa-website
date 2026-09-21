"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useNoteJournalDb } from "@/components/note/note-journal-db-context";
import {
  applyView,
  groupRows,
  PROPERTY_TYPE_LABELS,
  resolveCellDisplay,
  type JournalDbRow,
  type JournalFileRef,
  type JournalFilterOp,
  type JournalPropType,
  type JournalPropertyDef,
} from "@/lib/note/journal-db";
import { cn } from "@/lib/utils";

const PROP_TYPES: JournalPropType[] = [
  "title",
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "checkbox",
  "url",
  "files",
  "formula",
  "relation",
  "rollup",
];

type Panel = "filter" | "sort" | "group" | "columns" | "more" | null;

function selectLabel(prop: JournalPropertyDef, raw: unknown): string {
  if (raw == null || raw === "") return "-";
  const id = String(raw);
  return prop.options?.find((o) => o.id === id)?.label ?? id;
}

function displayText(prop: JournalPropertyDef, row: JournalDbRow, allProps: JournalPropertyDef[], allRows: JournalDbRow[]): string {
  if (prop.type === "formula" || prop.type === "rollup") {
    const v = resolveCellDisplay(row, prop, allProps, allRows);
    return v == null || v === "" ? "-" : String(v);
  }
  const raw = row.values[prop.id];
  if (prop.type === "checkbox") return raw ? "Yes" : "No";
  if (prop.type === "select") return selectLabel(prop, raw);
  if (prop.type === "multi_select") {
    const ids = Array.isArray(raw) ? raw.map(String) : [];
    if (!ids.length) return "-";
    return ids.map((id) => prop.options?.find((o) => o.id === id)?.label ?? id).join(", ");
  }
  if (prop.type === "files") {
    const files = Array.isArray(raw) ? (raw as JournalFileRef[]) : [];
    return files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : "-";
  }
  if (raw == null || raw === "") return "-";
  return String(raw);
}

function CellEditor({
  prop,
  row,
  onChange,
  onUpload,
  getBlobUrl,
  autoFocus,
}: {
  prop: JournalPropertyDef;
  row: JournalDbRow;
  onChange: (value: unknown) => void;
  onUpload: (file: File) => void;
  getBlobUrl: (id: string) => Promise<string | null>;
  autoFocus?: boolean;
}) {
  const raw = row.values[prop.id];

  if (prop.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(raw)}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--note-accent)]"
        autoFocus={autoFocus}
      />
    );
  }

  if (prop.type === "select") {
    return (
      <select
        className="note-field min-h-9 w-full min-w-[7rem] text-sm"
        value={typeof raw === "string" ? raw : ""}
        onChange={(e) => onChange(e.target.value || null)}
        autoFocus={autoFocus}
      >
        <option value="">-</option>
        {(prop.options ?? []).map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (prop.type === "number") {
    return (
      <input
        type="number"
        step="any"
        className="note-field min-h-9 w-full min-w-[5rem] text-sm tabular-nums"
        value={raw == null || raw === "" ? "" : String(raw)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        autoFocus={autoFocus}
      />
    );
  }

  if (prop.type === "date") {
    return (
      <input
        type="date"
        className="note-field min-h-9 w-full min-w-[8rem] text-sm"
        value={typeof raw === "string" ? raw.slice(0, 10) : ""}
        onChange={(e) => onChange(e.target.value || null)}
        autoFocus={autoFocus}
      />
    );
  }

  if (prop.type === "files") {
    return (
      <FilesCell files={Array.isArray(raw) ? (raw as JournalFileRef[]) : []} onUpload={onUpload} getBlobUrl={getBlobUrl} dense={false} />
    );
  }

  if (prop.type === "formula" || prop.type === "rollup") {
    return <span className="text-sm tabular-nums text-zinc-400">{String(raw ?? "-")}</span>;
  }

  if (prop.type === "relation") {
    const ids = Array.isArray(raw) ? raw.map(String) : [];
    return (
      <input
        className="note-field min-h-9 w-full text-sm"
        placeholder="row ids, comma-separated"
        value={ids.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        autoFocus={autoFocus}
      />
    );
  }

  return (
    <input
      className="note-field min-h-9 w-full min-w-[8rem] text-sm"
      value={typeof raw === "string" || typeof raw === "number" ? String(raw) : ""}
      onChange={(e) => onChange(e.target.value)}
      autoFocus={autoFocus}
    />
  );
}

function FilesCell({
  files,
  onUpload,
  getBlobUrl,
  dense,
}: {
  files: JournalFileRef[];
  onUpload: (file: File) => void;
  getBlobUrl: (id: string) => Promise<string | null>;
  dense: boolean;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [driveHint, setDriveHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      for (const f of files) {
        if (f.storage !== "idb") continue;
        const url = await getBlobUrl(f.id);
        if (url) next[f.id] = url;
      }
      if (!cancelled) setUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [files, getBlobUrl]);

  return (
    <div className={cn("flex", dense ? "items-center gap-1.5" : "min-w-[9rem] flex-col gap-1.5")}>
      <div className="flex flex-wrap gap-1">
        {files.length === 0 && dense ? <span className="text-sm text-zinc-600">-</span> : null}
        {files.map((f) =>
          urls[f.id] ? (
            <a
              key={f.id}
              href={urls[f.id]}
              target="_blank"
              rel="noreferrer"
              className="block size-9 overflow-hidden rounded border border-zinc-700"
              title={f.name}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls[f.id]} alt={f.name} className="size-full object-cover" />
            </a>
          ) : (
            <span key={f.id} className="truncate text-xs text-zinc-500">
              {f.name}
            </span>
          )
        )}
      </div>
      {!dense ? (
        <>
          <div className="flex flex-wrap gap-1">
            <label className="inline-flex min-h-9 cursor-pointer items-center rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-400 hover:bg-zinc-800"
              onClick={() => setDriveHint((v) => !v)}
            >
              Drive
            </button>
          </div>
          {driveHint ? (
            <p className="text-xs leading-snug text-zinc-500">
              Connect Google Drive soon: images stay in your Drive folder. Bursa only stores file IDs (no hosting cost).
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ToolbarToggle({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  count?: number;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium",
        active
          ? "border-zinc-500 bg-zinc-800 text-zinc-100"
          : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      )}
    >
      {children}
      {count && count > 0 ? (
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-200">{count}</span>
      ) : null}
    </button>
  );
}

export function NoteJournalDatabase() {
  const db = useNoteJournalDb();
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [editing, setEditing] = useState<{ rowId: string; propId: string } | null>(null);
  const [filterDraft, setFilterDraft] = useState<{ propertyId: string; op: JournalFilterOp; value: string }>({
    propertyId: "",
    op: "contains",
    value: "",
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const activeView = useMemo(() => {
    if (!db.schema) return null;
    return db.schema.views.find((v) => v.id === db.activeViewId) ?? db.schema.views[0] ?? null;
  }, [db.schema, db.activeViewId]);

  const visibleProps = useMemo(() => {
    if (!db.schema || !activeView) return [];
    const byId = new Map(db.schema.properties.map((p) => [p.id, p]));
    return activeView.visiblePropertyIds
      .map((id) => byId.get(id))
      .filter((p): p is JournalPropertyDef => Boolean(p) && !p!.hidden);
  }, [db.schema, activeView]);

  const viewedRows = useMemo(() => {
    if (!db.schema || !activeView) return [];
    return applyView(db.rows, activeView, db.schema);
  }, [db.rows, db.schema, activeView]);

  const groups = useMemo(
    () => groupRows(viewedRows, activeView?.groupBy),
    [viewedRows, activeView?.groupBy]
  );

  const rSum = useMemo(
    () => db.projectedEntries.reduce((s, e) => s + (e.pnl ?? 0), 0),
    [db.projectedEntries]
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!editing) return;
      const t = e.target as Node;
      if (tableRef.current && !tableRef.current.contains(t)) setEditing(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditing(null);
        setPanel(null);
        setDrawerId(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [editing]);

  if (!db.ready) {
    return <p className="text-sm text-zinc-400">Loading journal…</p>;
  }
  if (db.error || !db.schema || !activeView) {
    return <p className="note-pnl-down text-sm">{db.error ?? "Schema missing"}</p>;
  }

  const localeProps = db.schema.properties;
  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  const titleProp = visibleProps.find((p) => p.type === "title") ?? visibleProps[0];
  const otherProps = visibleProps.filter((p) => p.id !== titleProp?.id);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {db.schema.views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => db.setActiveViewId(v.id)}
            className={cn(
              "inline-flex min-h-9 items-center rounded-md border px-2.5 text-xs font-medium",
              v.id === activeView.id
                ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            )}
          >
            {v.name}
          </button>
        ))}
        <button
          type="button"
          className="inline-flex min-h-9 items-center rounded-md border border-dashed border-zinc-700 px-2.5 text-xs text-zinc-400 hover:text-zinc-200"
          onClick={() => void db.addView()}
        >
          + View
        </button>

        <span className="mx-0.5 hidden h-4 w-px bg-zinc-800 sm:block" />

        <ToolbarToggle active={panel === "filter"} count={activeView.filters.length} onClick={() => togglePanel("filter")}>
          Filter
        </ToolbarToggle>
        <ToolbarToggle active={panel === "sort"} count={activeView.sorts.length} onClick={() => togglePanel("sort")}>
          Sort
        </ToolbarToggle>
        <ToolbarToggle active={panel === "group"} count={activeView.groupBy ? 1 : 0} onClick={() => togglePanel("group")}>
          Group
        </ToolbarToggle>
        <ToolbarToggle active={panel === "columns"} onClick={() => togglePanel("columns")}>
          Columns
        </ToolbarToggle>

        <span className="mx-0.5 hidden h-4 w-px bg-zinc-800 sm:block" />

        <button
          type="button"
          className="inline-flex min-h-9 items-center rounded-md bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 hover:bg-white"
          onClick={() => void db.createEmptyRow().then((row) => setDrawerId(row.id))}
        >
          + New
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800"
          onClick={() => {
            setAddPropOpen((o) => !o);
            setPanel(null);
          }}
        >
          + Property
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200"
          onClick={() => togglePanel("more")}
          aria-label="More actions"
        >
          ···
        </button>

        <p className="ml-auto text-xs tabular-nums text-zinc-500">
          {viewedRows.length} rows
          {db.projectedEntries.length ? ` · ${rSum.toFixed(2)}R` : null}
        </p>
      </div>

      {addPropOpen ? (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
          {PROP_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-700 px-2 text-xs text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                void db.addProperty(t, PROPERTY_TYPE_LABELS[t].en);
                setAddPropOpen(false);
              }}
            >
              {PROPERTY_TYPE_LABELS[t].en}
            </button>
          ))}
        </div>
      ) : null}

      {panel === "filter" ? (
        <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          {activeView.filters.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {activeView.filters.map((f) => {
                const prop = localeProps.find((p) => p.id === f.propertyId);
                return (
                  <li
                    key={f.id}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-300"
                  >
                    <span>
                      {prop?.name ?? f.propertyId} {f.op} {String(f.value ?? "")}
                    </span>
                    <button
                      type="button"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center text-zinc-500 hover:text-zinc-200"
                      aria-label="Remove filter"
                      onClick={() =>
                        void db.updateView({
                          ...activeView,
                          filters: activeView.filters.filter((x) => x.id !== f.id),
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  className="text-xs text-zinc-500 underline decoration-dotted underline-offset-2"
                  onClick={() => void db.updateView({ ...activeView, filters: [] })}
                >
                  Clear all
                </button>
              </li>
            </ul>
          ) : null}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[10px] uppercase tracking-wide text-zinc-500">
              Property
              <select
                className="note-field mt-0.5 block min-h-9 min-w-[8rem] text-sm"
                value={filterDraft.propertyId}
                onChange={(e) => setFilterDraft((d) => ({ ...d, propertyId: e.target.value }))}
              >
                <option value="">-</option>
                {localeProps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-wide text-zinc-500">
              Op
              <select
                className="note-field mt-0.5 block min-h-9 text-sm"
                value={filterDraft.op}
                onChange={(e) => setFilterDraft((d) => ({ ...d, op: e.target.value as JournalFilterOp }))}
              >
                {(["contains", "equals", "not_equals", "is_empty", "is_not_empty", "gt", "lt"] as const).map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-wide text-zinc-500">
              Value
              <input
                className="note-field mt-0.5 block min-h-9 min-w-[8rem] text-sm"
                value={filterDraft.value}
                onChange={(e) => setFilterDraft((d) => ({ ...d, value: e.target.value }))}
              />
            </label>
            <button
              type="button"
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-800"
              onClick={() => {
                if (!filterDraft.propertyId) return;
                void db.updateView({
                  ...activeView,
                  filters: [
                    ...activeView.filters,
                    {
                      id: `f_${Date.now()}`,
                      propertyId: filterDraft.propertyId,
                      op: filterDraft.op,
                      value: filterDraft.value,
                    },
                  ],
                });
                setFilterDraft({ propertyId: "", op: "contains", value: "" });
              }}
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      {panel === "sort" ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">
            Sort by
            <select
              className="note-field mt-0.5 block min-h-9 min-w-[10rem] text-sm"
              value={activeView.sorts[0]?.propertyId ?? ""}
              onChange={(e) => {
                const propertyId = e.target.value;
                void db.updateView({
                  ...activeView,
                  sorts: propertyId
                    ? [{ propertyId, direction: activeView.sorts[0]?.direction ?? "desc" }]
                    : [],
                });
              }}
            >
              <option value="">None</option>
              {localeProps.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">
            Direction
            <select
              className="note-field mt-0.5 block min-h-9 text-sm"
              value={activeView.sorts[0]?.direction ?? "desc"}
              disabled={!activeView.sorts[0]}
              onChange={(e) => {
                const s = activeView.sorts[0];
                if (!s) return;
                void db.updateView({
                  ...activeView,
                  sorts: [{ ...s, direction: e.target.value as "asc" | "desc" }],
                });
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
      ) : null}

      {panel === "group" ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">
            Group by
            <select
              className="note-field mt-0.5 block min-h-9 min-w-[10rem] text-sm"
              value={activeView.groupBy ?? ""}
              onChange={(e) => void db.updateView({ ...activeView, groupBy: e.target.value || null })}
            >
              <option value="">None</option>
              {localeProps.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {panel === "columns" ? (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {localeProps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((p) => {
                const on = activeView.visiblePropertyIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-zinc-300 hover:bg-zinc-800/60">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={p.type === "title" && on}
                        onChange={() => {
                          const next = on
                            ? activeView.visiblePropertyIds.filter((id) => id !== p.id)
                            : [...activeView.visiblePropertyIds, p.id];
                          if (!next.length) return;
                          void db.updateView({ ...activeView, visiblePropertyIds: next });
                        }}
                        className="size-4 accent-[var(--note-accent)]"
                      />
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-[10px] text-zinc-600">{PROPERTY_TYPE_LABELS[p.type].en}</span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </div>
      ) : null}

      {panel === "more" ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <button
            type="button"
            className="inline-flex min-h-9 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
            onClick={() => {
              void db.reseedBagas();
              setPanel(null);
            }}
          >
            Reset Bagas seed
          </button>
        </div>
      ) : null}

      <div ref={tableRef} className="overflow-x-auto rounded-lg border border-zinc-800/80">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-950">
            <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-400">
              {titleProp ? (
                <th className="sticky left-0 z-[1] min-w-[9rem] bg-zinc-950 px-3 py-2.5 font-medium">
                  <span title={PROPERTY_TYPE_LABELS[titleProp.type].en}>{titleProp.name}</span>
                </th>
              ) : null}
              {otherProps.map((p) => (
                <th key={p.id} className="min-w-[6.5rem] px-3 py-2.5 font-medium">
                  <span title={PROPERTY_TYPE_LABELS[p.type].en}>{p.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.key || "__all"}>
                {g.key ? (
                  <tr className="bg-zinc-900/50">
                    <td
                      colSpan={visibleProps.length}
                      className="px-3 py-2 text-xs font-medium text-zinc-300"
                    >
                      {g.key} · {g.rows.length}
                    </td>
                  </tr>
                ) : null}
                {g.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-zinc-800/60 hover:bg-zinc-900/50"
                    onDoubleClick={() => setDrawerId(row.id)}
                  >
                    {titleProp ? (
                      <td className="sticky left-0 z-[1] bg-zinc-950 px-3 py-2 align-middle group-hover:bg-zinc-900">
                        <button
                          type="button"
                          className="flex min-h-10 w-full items-center truncate text-left text-sm font-medium text-zinc-100 hover:underline"
                          onClick={() => setDrawerId(row.id)}
                        >
                          {displayText(titleProp, row, localeProps, db.rows)}
                        </button>
                      </td>
                    ) : null}
                    {otherProps.map((p) => {
                      const isEditing = editing?.rowId === row.id && editing?.propId === p.id;
                      const isReadonly = p.type === "formula" || p.type === "rollup";
                      return (
                        <td
                          key={p.id}
                          className="px-3 py-2 align-middle"
                          onClick={(e) => {
                            if (isReadonly || p.type === "files") return;
                            e.stopPropagation();
                            setEditing({ rowId: row.id, propId: p.id });
                          }}
                        >
                          {isEditing ? (
                            <CellEditor
                              prop={p}
                              row={row}
                              autoFocus
                              onChange={(value) =>
                                void db.upsertRow({
                                  ...row,
                                  values: { ...row.values, [p.id]: value },
                                })
                              }
                              onUpload={(file) => void db.uploadFileToRow(row.id, p.id, file)}
                              getBlobUrl={db.getBlobUrl}
                            />
                          ) : p.type === "files" ? (
                            <FilesCell
                              files={Array.isArray(row.values[p.id]) ? (row.values[p.id] as JournalFileRef[]) : []}
                              onUpload={(file) => void db.uploadFileToRow(row.id, p.id, file)}
                              getBlobUrl={db.getBlobUrl}
                              dense
                            />
                          ) : (
                            <span
                              className={cn(
                                "block max-w-[16rem] truncate text-sm text-zinc-300",
                                p.type === "number" && "tabular-nums",
                                p.id === "side" &&
                                  String(row.values[p.id]).toUpperCase() === "BUY" &&
                                  "font-medium text-emerald-400",
                                p.id === "side" &&
                                  String(row.values[p.id]).toUpperCase() === "SELL" &&
                                  "font-medium text-rose-400",
                                p.id === "tp_sl" &&
                                  ["full_tp", "tp"].includes(String(row.values[p.id])) &&
                                  "text-emerald-400",
                                p.id === "tp_sl" &&
                                  ["sl", "sl_plus", "cancel_sl"].includes(String(row.values[p.id])) &&
                                  "text-rose-400",
                                p.id === "rr" &&
                                  typeof row.values[p.id] === "number" &&
                                  (row.values[p.id] as number) > 0 &&
                                  "tabular-nums text-emerald-400",
                                p.id === "rr" &&
                                  typeof row.values[p.id] === "number" &&
                                  (row.values[p.id] as number) < 0 &&
                                  "tabular-nums text-rose-400",
                                !isReadonly && "cursor-text rounded px-1 -mx-1 hover:bg-zinc-800/80"
                              )}
                            >
                              {displayText(p, row, localeProps, db.rows)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
            {!viewedRows.length ? (
              <tr>
                <td colSpan={Math.max(visibleProps.length, 1)} className="px-3 py-10 text-center text-sm text-zinc-500">
                  No rows. Tap + New or clear filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">Click cell to edit · Pair opens detail · Esc closes</p>

      {drawerId ? (
        <RowDrawer
          row={db.rows.find((r) => r.id === drawerId) ?? null}
          props={localeProps}
          onClose={() => setDrawerId(null)}
          onChange={(row) => void db.upsertRow(row)}
          onUpload={(propId, file) => void db.uploadFileToRow(drawerId, propId, file)}
          getBlobUrl={db.getBlobUrl}
          onDelete={() => {
            void db.deleteRow(drawerId);
            setDrawerId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function RowDrawer({
  row,
  props,
  onClose,
  onChange,
  onUpload,
  getBlobUrl,
  onDelete,
}: {
  row: JournalDbRow | null;
  props: JournalPropertyDef[];
  onClose: () => void;
  onChange: (row: JournalDbRow) => void;
  onUpload: (propId: string, file: File) => void;
  getBlobUrl: (id: string) => Promise<string | null>;
  onDelete: () => void;
}) {
  if (!row) return null;
  const title = props.find((p) => p.type === "title");
  const heading =
    title && row.values[title.id] != null && String(row.values[title.id]).trim()
      ? String(row.values[title.id])
      : "Trade";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <h2 className="truncate text-sm font-semibold text-zinc-100">{heading}</h2>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="inline-flex min-h-9 items-center rounded-md px-2.5 text-xs text-rose-300 hover:bg-zinc-900"
              onClick={onDelete}
            >
              Delete
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center rounded-md px-2.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {props
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((p) => {
              const compact =
                p.type === "number" ||
                p.type === "date" ||
                p.type === "select" ||
                p.type === "checkbox";
              return (
                <label
                  key={p.id}
                  className={cn("block space-y-1.5", compact && "sm:inline-block sm:w-[calc(50%-0.5rem)] sm:align-top sm:mr-2")}
                >
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {p.name}
                  </span>
                  <CellEditor
                    prop={p}
                    row={row}
                    onChange={(value) => onChange({ ...row, values: { ...row.values, [p.id]: value } })}
                    onUpload={(file) => onUpload(p.id, file)}
                    getBlobUrl={getBlobUrl}
                  />
                </label>
              );
            })}
        </div>
      </aside>
    </div>
  );
}
