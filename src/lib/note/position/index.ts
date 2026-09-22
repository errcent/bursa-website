/**
 * Bursa position-cycle engine — public surface.
 * Pure domain logic: no IO, no framework. Fully unit-tested.
 */

export type {
  CycleMethod,
  CycleOutcome,
  ExitSlice,
  Fill,
  FillOrigin,
  FillSide,
  PositionCycle,
  PositionDirection,
} from "./types";
export { buildPositionCycles, type BuildCyclesOptions } from "./cycle";
export { FLAT_TOL, matchLots, openSizeOf, type Lot, type MatchResult } from "./matcher";
export {
  closeCycle,
  emptyPosition,
  type CycleMeta,
  type OpenPosition,
} from "./finalize";
export { cyclesToEntries } from "./adapter";
