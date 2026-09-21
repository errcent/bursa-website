import type {
  JournalDbRow,
  JournalDbSchema,
  JournalDbView,
  JournalFilterOp,
  JournalPropertyDef,
  JournalViewFilter,
} from "./types";

function cellRaw(row: JournalDbRow, propId: string): unknown {
  return row.values[propId];
}

function asComparable(v: unknown): string | number | boolean | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(String).join(",");
  return String(v);
}

function matchFilter(row: JournalDbRow, f: JournalViewFilter): boolean {
  const raw = cellRaw(row, f.propertyId);
  const left = asComparable(raw);
  const right = asComparable(f.value);
  const op: JournalFilterOp = f.op;

  if (op === "is_empty") return left == null || left === "";
  if (op === "is_not_empty") return left != null && left !== "";
  if (op === "contains") {
    return String(left ?? "")
      .toLowerCase()
      .includes(String(right ?? "").toLowerCase());
  }
  if (op === "equals") return left === right || String(left) === String(right);
  if (op === "not_equals") return left !== right && String(left) !== String(right);

  const ln = typeof left === "number" ? left : Number(left);
  const rn = typeof right === "number" ? right : Number(right);
  if (!Number.isFinite(ln) || !Number.isFinite(rn)) return false;
  if (op === "gt") return ln > rn;
  if (op === "lt") return ln < rn;
  if (op === "gte") return ln >= rn;
  if (op === "lte") return ln <= rn;
  return true;
}

function compareValues(a: unknown, b: unknown, dir: "asc" | "desc"): number {
  const av = asComparable(a);
  const bv = asComparable(b);
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  let cmp = 0;
  if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
  else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
  return dir === "asc" ? cmp : -cmp;
}

export function applyView(
  rows: JournalDbRow[],
  view: JournalDbView,
  schema: JournalDbSchema
): JournalDbRow[] {
  let out = rows.filter((row) => view.filters.every((f) => matchFilter(row, f)));
  if (view.sorts.length) {
    out = [...out].sort((a, b) => {
      for (const s of view.sorts) {
        const cmp = compareValues(a.values[s.propertyId], b.values[s.propertyId], s.direction);
        if (cmp !== 0) return cmp;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }
  void schema;
  return out;
}

export function groupRows(
  rows: JournalDbRow[],
  groupBy: string | null | undefined
): { key: string; rows: JournalDbRow[] }[] {
  if (!groupBy) return [{ key: "", rows }];
  const map = new Map<string, JournalDbRow[]>();
  for (const row of rows) {
    const raw = asComparable(row.values[groupBy]);
    const key = raw == null || raw === "" ? "(Empty)" : String(raw);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, group]) => ({ key, rows: group }));
}

/** Evaluate simple {{propId}} arithmetic formulas. */
export function evalFormula(
  expression: string,
  row: JournalDbRow,
  props: JournalPropertyDef[]
): number | string | null {
  const expr = expression.trim();
  if (!expr) return null;
  let replaced = expr;
  for (const p of props) {
    const token = `{{${p.id}}}`;
    if (!replaced.includes(token)) continue;
    const raw = row.values[p.id];
    const n = typeof raw === "number" ? raw : Number(raw);
    replaced = replaced.split(token).join(Number.isFinite(n) ? String(n) : "0");
  }
  if (!/^[\d\s+\-*/().]+$/.test(replaced)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${replaced});`);
    const result = fn();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function resolveCellDisplay(
  row: JournalDbRow,
  prop: JournalPropertyDef,
  allProps: JournalPropertyDef[],
  allRows: JournalDbRow[]
): unknown {
  if (prop.type === "formula" && prop.formula?.expression) {
    return evalFormula(prop.formula.expression, row, allProps);
  }
  if (prop.type === "rollup" && prop.rollup) {
    const rel = row.values[prop.rollup.relationPropId];
    const ids = Array.isArray(rel) ? rel.map(String) : [];
    const related = allRows.filter((r) => ids.includes(r.id));
    if (prop.rollup.aggregation === "count") return related.length;
    const nums = related
      .map((r) => Number(r.values[prop.rollup!.targetPropId]))
      .filter((n) => Number.isFinite(n));
    if (!nums.length) return null;
    if (prop.rollup.aggregation === "sum") return nums.reduce((a, b) => a + b, 0);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  return row.values[prop.id];
}
