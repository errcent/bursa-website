import { FLAT_TOL, type Lot } from "./matcher";
import type { CycleOutcome, ExitSlice, PositionCycle, PositionDirection } from "./types";

export interface OpenPosition {
  direction: PositionDirection;
  openedAt: string;
  lots: Lot[];
  entrySize: number;
  entryValue: number;
  exitSize: number;
  exitValue: number;
  gross: number;
  fees: number;
  grossVariance: number;
  fillIds: string[];
  slices: ExitSlice[];
  fillCount: number;
}

export function emptyPosition(direction: PositionDirection, openedAt: string): OpenPosition {
  return {
    direction,
    openedAt,
    lots: [],
    entrySize: 0,
    entryValue: 0,
    exitSize: 0,
    exitValue: 0,
    gross: 0,
    fees: 0,
    grossVariance: 0,
    fillIds: [],
    slices: [],
    fillCount: 0,
  };
}

export interface CycleMeta {
  ref: string;
  accountRef: string;
  ticker: string;
  closedAt?: string;
  pointValue?: number;
}

export function closeCycle(open: OpenPosition, meta: CycleMeta): PositionCycle {
  let openSize = 0;
  for (const lot of open.lots) openSize += lot.size;
  const net = open.gross - open.fees;
  const live = openSize > FLAT_TOL;
  const outcome: CycleOutcome = live
    ? "open"
    : Math.abs(net) <= 1e-9
      ? "flat"
      : net > 0
        ? "win"
        : "loss";

  return {
    ref: meta.ref,
    accountRef: meta.accountRef,
    ticker: meta.ticker,
    direction: open.direction,
    outcome,
    openedAt: open.openedAt,
    closedAt: live ? undefined : meta.closedAt,
    entrySize: open.entrySize,
    openSize: live ? openSize : 0,
    meanEntry: open.entrySize > 0 ? open.entryValue / open.entrySize : 0,
    meanExit: open.exitSize > 0 ? open.exitValue / open.exitSize : undefined,
    gross: open.gross,
    fees: open.fees,
    net,
    grossVariance: open.grossVariance,
    fillCount: open.fillCount,
    fillIds: open.fillIds,
    slices: open.slices,
    heldMs:
      !live && meta.closedAt
        ? Date.parse(meta.closedAt) - Date.parse(open.openedAt)
        : undefined,
    ...(meta.pointValue !== undefined ? { pointValue: meta.pointValue } : {}),
  };
}
