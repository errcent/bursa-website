import { ChatRoomTier, CourseLevel, Instrument } from "@prisma/client";

import type { ChatRoomTierLabel } from "@/lib/admin/types";
import type { Instrument as UiInstrument, Level } from "@/lib/types";

const INSTRUMENT_TO_UI: Record<Instrument, UiInstrument> = {
  SAHAM: "Saham",
  CRYPTO: "Crypto",
  FOREX: "Forex",
};

const INSTRUMENT_FROM_UI: Record<UiInstrument, Instrument> = {
  Saham: Instrument.SAHAM,
  Crypto: Instrument.CRYPTO,
  Forex: Instrument.FOREX,
};

const LEVEL_TO_UI: Record<CourseLevel, Level> = {
  PEMULA: "Pemula",
  MENENGAH: "Menengah",
  MAHIR: "Mahir",
};

const LEVEL_FROM_UI: Record<Level, CourseLevel> = {
  Pemula: CourseLevel.PEMULA,
  Menengah: CourseLevel.MENENGAH,
  Mahir: CourseLevel.MAHIR,
};

const TIER_TO_UI: Record<ChatRoomTier, ChatRoomTierLabel> = {
  PEMULA: "Pemula",
  MENENGAH: "Menengah",
  MAHIR: "Mahir",
  INTERNAL: "Internal",
};

const TIER_FROM_UI: Record<ChatRoomTierLabel, ChatRoomTier> = {
  Pemula: ChatRoomTier.PEMULA,
  Menengah: ChatRoomTier.MENENGAH,
  Mahir: ChatRoomTier.MAHIR,
  Internal: ChatRoomTier.INTERNAL,
};

export function instrumentToUi(value: Instrument): UiInstrument {
  return INSTRUMENT_TO_UI[value];
}

export function instrumentFromUi(value: UiInstrument): Instrument {
  return INSTRUMENT_FROM_UI[value];
}

export function levelToUi(value: CourseLevel): Level {
  return LEVEL_TO_UI[value];
}

export function levelFromUi(value: Level): CourseLevel {
  return LEVEL_FROM_UI[value];
}

export function tierToUi(value: ChatRoomTier): ChatRoomTierLabel {
  return TIER_TO_UI[value];
}

export function tierFromUi(value: ChatRoomTierLabel): ChatRoomTier {
  return TIER_FROM_UI[value];
}
