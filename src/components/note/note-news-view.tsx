"use client";

import { useCallback, useEffect, useState } from "react";

import { NoteEconomicCalendar } from "@/components/note/note-economic-calendar";
import { loadEconomicFilter, saveEconomicFilter } from "@/lib/note/economic-calendar/filter-storage";
import { NEWS_MONTH_FILTER, type EconomicCalendarFilterState } from "@/lib/note/economic-calendar/filters";

export function NoteNewsView() {
  const [filter, setFilter] = useState<EconomicCalendarFilterState>(NEWS_MONTH_FILTER);

  useEffect(() => {
    setFilter(loadEconomicFilter(NEWS_MONTH_FILTER));
  }, []);

  const onFilterCommit = useCallback((next: EconomicCalendarFilterState) => {
    setFilter(next);
    saveEconomicFilter(next);
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <NoteEconomicCalendar
        monthScope
        showCharts
        filter={filter}
        onFilterCommit={onFilterCommit}
      />
    </div>
  );
}
