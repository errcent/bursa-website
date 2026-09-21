/** Notion-style journal database types (client + server projector). */

export const JOURNAL_DB_STORAGE_KEY = "note-journal-db-v1";
export const JOURNAL_DB_IDB_NAME = "note-journal-db-v1";
export const JOURNAL_DB_IDB_VERSION = 1;

export type JournalPropType =
  | "title"
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "url"
  | "files"
  | "formula"
  | "relation"
  | "rollup";

export type JournalSelectOption = {
  id: string;
  label: string;
  color?: string;
};

export type JournalFileRef = {
  storage: "idb" | "drive";
  id: string;
  name: string;
  mime: string;
  size: number;
  driveFileId?: string;
};

export type JournalFormulaConfig = {
  /** Safe expression referencing prop ids as {{propId}} */
  expression: string;
};

export type JournalRelationConfig = {
  /** Same-DB relation for v1 */
  target: "self";
};

export type JournalRollupConfig = {
  relationPropId: string;
  targetPropId: string;
  aggregation: "count" | "sum" | "avg";
};

export type JournalPropertyDef = {
  id: string;
  name: string;
  type: JournalPropType;
  options?: JournalSelectOption[];
  width?: number;
  hidden?: boolean;
  order: number;
  /** Reserved props cannot be deleted (analytics projector). */
  reserved?: boolean;
  formula?: JournalFormulaConfig;
  relation?: JournalRelationConfig;
  rollup?: JournalRollupConfig;
};

export type JournalFilterOp =
  | "equals"
  | "not_equals"
  | "contains"
  | "is_empty"
  | "is_not_empty"
  | "gt"
  | "lt"
  | "gte"
  | "lte";

export type JournalViewFilter = {
  id: string;
  propertyId: string;
  op: JournalFilterOp;
  value?: unknown;
};

export type JournalViewSort = {
  propertyId: string;
  direction: "asc" | "desc";
};

export type JournalDbView = {
  id: string;
  name: string;
  type: "table";
  filters: JournalViewFilter[];
  sorts: JournalViewSort[];
  groupBy?: string | null;
  visiblePropertyIds: string[];
};

export type JournalDbSchema = {
  version: 1;
  properties: JournalPropertyDef[];
  views: JournalDbView[];
  defaultViewId: string;
  updatedAt: string;
};

export type JournalDbRow = {
  id: string;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/** Reserved property IDs used by Overview/Analytics projector. */
export const RESERVED_PROP = {
  pair: "pair",
  alasan: "alasan",
  closeManual: "close_manual",
  fearGreed: "fear_greed",
  notes: "notes",
  rr: "rr",
  screenshot: "screenshot",
  setup: "setup",
  tpSl: "tp_sl",
  tanggal: "tanggal",
  confidence: "confidence",
  side: "side",
} as const;

export type ReservedPropId = (typeof RESERVED_PROP)[keyof typeof RESERVED_PROP];

export const PROPERTY_TYPE_LABELS: Record<JournalPropType, { id: string; en: string }> = {
  title: { id: "Title", en: "Title" },
  text: { id: "Teks", en: "Text" },
  number: { id: "Angka", en: "Number" },
  select: { id: "Select", en: "Select" },
  multi_select: { id: "Multi-select", en: "Multi-select" },
  date: { id: "Tanggal", en: "Date" },
  checkbox: { id: "Checkbox", en: "Checkbox" },
  url: { id: "URL", en: "URL" },
  files: { id: "Files", en: "Files" },
  formula: { id: "Formula", en: "Formula" },
  relation: { id: "Relation", en: "Relation" },
  rollup: { id: "Rollup", en: "Rollup" },
};
