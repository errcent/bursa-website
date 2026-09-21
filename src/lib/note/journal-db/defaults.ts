import {
  RESERVED_PROP,
  type JournalDbSchema,
  type JournalDbView,
  type JournalPropertyDef,
  type JournalSelectOption,
} from "./types";

function opt(id: string, label: string): JournalSelectOption {
  return { id, label };
}

function prop(
  partial: Omit<JournalPropertyDef, "order"> & { order?: number },
  order: number
): JournalPropertyDef {
  return { ...partial, order: partial.order ?? order };
}

/** Default Bagas Recap Trade schema (Notion export columns). */
export function createBagasDefaultSchema(now = new Date().toISOString()): JournalDbSchema {
  const properties: JournalPropertyDef[] = [
    prop({ id: RESERVED_PROP.pair, name: "Pair", type: "title", reserved: true }, 0),
    prop({ id: RESERVED_PROP.alasan, name: "Alasan Entry", type: "text", reserved: true }, 1),
    prop(
      {
        id: RESERVED_PROP.closeManual,
        name: "Close Manual",
        type: "select",
        reserved: true,
        options: [opt("yes", "Yes"), opt("no", "No")],
      },
      2
    ),
    prop({ id: RESERVED_PROP.fearGreed, name: "Fear & Greed", type: "number", reserved: true }, 3),
    prop({ id: RESERVED_PROP.notes, name: "Notes", type: "text", reserved: true }, 4),
    prop({ id: RESERVED_PROP.rr, name: "R:R", type: "number", reserved: true }, 5),
    prop({ id: RESERVED_PROP.screenshot, name: "Screenshot Chart", type: "files", reserved: true }, 6),
    prop({ id: RESERVED_PROP.setup, name: "Setup", type: "text", reserved: true }, 7),
    prop(
      {
        id: RESERVED_PROP.tpSl,
        name: "TP/SL",
        type: "select",
        reserved: true,
        options: [
          opt("full_tp", "Full TP"),
          opt("tp", "TP"),
          opt("sl", "SL"),
          opt("sl_plus", "SL Plus"),
          opt("be", "BE"),
          opt("cancel", "Cancel"),
          opt("cancel_sl", "Cancel (SL)"),
          opt("harusnya_full_tp", "Harusnya full tp"),
        ],
      },
      8
    ),
    prop({ id: RESERVED_PROP.tanggal, name: "Tanggal", type: "date", reserved: true }, 9),
    prop(
      { id: RESERVED_PROP.confidence, name: "Tingkat Kepercayaan (1-10)", type: "number", reserved: true },
      10
    ),
    prop(
      {
        id: RESERVED_PROP.side,
        name: "Side",
        type: "select",
        reserved: true,
        options: [opt("BUY", "BUY"), opt("SELL", "SELL")],
      },
      11
    ),
  ];

  /** Lean table: scan Pair / date / side / result first; rest via Columns. */
  const visiblePropertyIds = [
    RESERVED_PROP.pair,
    RESERVED_PROP.tanggal,
    RESERVED_PROP.side,
    RESERVED_PROP.tpSl,
    RESERVED_PROP.rr,
    RESERVED_PROP.alasan,
    RESERVED_PROP.screenshot,
  ];
  const defaultView: JournalDbView = {
    id: "view-all",
    name: "All trades",
    type: "table",
    filters: [],
    sorts: [{ propertyId: RESERVED_PROP.tanggal, direction: "desc" }],
    groupBy: null,
    visiblePropertyIds,
  };

  return {
    version: 1,
    properties,
    views: [defaultView],
    defaultViewId: defaultView.id,
    updatedAt: now,
  };
}

/** Default columns for the “All trades” table (handy scan width). */
export const BAGAS_DEFAULT_VISIBLE_PROP_IDS: string[] = [
  RESERVED_PROP.pair,
  RESERVED_PROP.tanggal,
  RESERVED_PROP.side,
  RESERVED_PROP.tpSl,
  RESERVED_PROP.rr,
  RESERVED_PROP.alasan,
  RESERVED_PROP.screenshot,
];

/**
 * One-shot migrate: older seeds showed every property and made the table unusable.
 * Only rewrites the stock `view-all` when it still lists every property.
 */
export function migrateSchemaHandyViews(schema: JournalDbSchema): JournalDbSchema {
  const allIds = schema.properties.map((p) => p.id);
  const views = schema.views.map((v) => {
    if (v.id !== "view-all") return v;
    if (v.visiblePropertyIds.length !== allIds.length) return v;
    const sameSet =
      allIds.every((id) => v.visiblePropertyIds.includes(id)) &&
      v.visiblePropertyIds.every((id) => allIds.includes(id));
    if (!sameSet) return v;
    return { ...v, visiblePropertyIds: [...BAGAS_DEFAULT_VISIBLE_PROP_IDS] };
  });
  if (views.every((v, i) => v === schema.views[i])) return schema;
  return { ...schema, views, updatedAt: new Date().toISOString() };
}

export function newPropertyId(type: string): string {
  return `prop_${type}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newViewId(): string {
  return `view_${Math.random().toString(36).slice(2, 9)}`;
}

export function newRowId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
