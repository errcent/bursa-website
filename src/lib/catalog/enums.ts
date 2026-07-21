import { ChatRoomTier, CourseLevel, Instrument } from "@prisma/client";

import type { ChatRoomTierLabel } from "@/lib/admin/types";
import type { Instrument as UiInstrument, Level } from "@/lib/types";

export function instrumentToUi(value: Instrument): UiInstrument {
  const map: Record<Instrument, UiInstrument> = {
    SAHAM: "Saham",
    CRYPTO: "Crypto",
    FOREX: "Forex",
  };
  return map[value];
}

export function instrumentFromUi(value: UiInstrument): Instrument {
  const map: Record<UiInstrument, Instrument> = {
    Saham: Instrument.SAHAM,
    Crypto: Instrument.CRYPTO,
    Forex: Instrument.FOREX,
  };
  return map[value];
}

export function levelToUi(value: CourseLevel): Level {
  const map: Record<CourseLevel, Level> = {
    PEMULA: "Pemula",
    MENENGAH: "Menengah",
    MAHIR: "Mahir",
  };
  return map[value];
}

export function levelFromUi(value: Level): CourseLevel {
  const map: Record<Level, CourseLevel> = {
    Pemula: CourseLevel.PEMULA,
    Menengah: CourseLevel.MENENGAH,
    Mahir: CourseLevel.MAHIR,
  };
  return map[value];
}

export function tierToUi(value: ChatRoomTier): ChatRoomTierLabel {
  const map: Record<ChatRoomTier, ChatRoomTierLabel> = {
    PEMULA: "Pemula",
    MENENGAH: "Menengah",
    MAHIR: "Mahir",
    INTERNAL: "Internal",
  };
  return map[value];
}

export function tierFromUi(value: ChatRoomTierLabel): ChatRoomTier {
  const map: Record<ChatRoomTierLabel, ChatRoomTier> = {
    Pemula: ChatRoomTier.PEMULA,
    Menengah: ChatRoomTier.MENENGAH,
    Mahir: ChatRoomTier.MAHIR,
    Internal: ChatRoomTier.INTERNAL,
  };
  return map[value];
}
