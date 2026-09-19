"use client"

import { useMemo, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import type { DayBucket, WeekStart } from "@/lib/note/stats"
import { weekPad, weekdayLabels } from "@/lib/note/stats"

const EASE = [0.16, 1, 0.3, 1] as const
const GREEN = "var(--chart-up, #34d399)"
const RED = "var(--chart-down, #fb7185)"

const signed = (v: number, dp: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(dp)}`

/** Subtle fill so PnL text (saturated) stays readable on hero calendar cells. */
const cellFill = (r: number, on: boolean) =>
  `color-mix(in srgb, ${r >= 0 ? GREEN : RED} ${Math.round(Math.min(Math.abs(r) / 8, 1) * 22 + (on ? 10 : 4))}%, transparent)`

const compound = (row: number[]) => (row.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100

/** Weekly total: quiet reference, not a performance target (fits small circle). */
function weekBadgeText(
  weekPnl: number,
  weekTotalPct: number,
  formatDayPnl?: (pnl: number) => string
) {
  if (formatDayPnl) return formatDayPnl(weekPnl)
  return signed(weekTotalPct, 0)
}

export type DailyReturnsCalendarProps = {
  year: number
  monthIndex: number
  buckets: DayBucket[]
  /** Map date YYYY-MM-DD → daily return % */
  returnPctByDate: Map<string, number>
  selectedDate: string | null
  today: string
  weekStart: WeekStart
  locale?: "id" | "en"
  title?: string
  hint?: string
  /** compact = sidebar/widget; hero = overview primary surface */
  variant?: "compact" | "hero"
  /** Hero: show signed daily PnL label from bucket (caller formats via naked compact). */
  formatDayPnl?: (pnl: number) => string
  /** Hero: right header when no day is hovered (e.g. month PnL + WR). */
  headerIdle?: ReactNode
  className?: string
  onSelect: (date: string) => void
  onPrev: () => void
  onNext: () => void
}

export default function DailyReturnsCalendar({
  year,
  monthIndex,
  buckets,
  returnPctByDate,
  selectedDate,
  today,
  weekStart,
  locale = "id",
  title,
  hint,
  variant = "compact",
  formatDayPnl,
  headerIdle,
  className,
  onSelect,
  onPrev,
  onNext,
}: DailyReturnsCalendarProps) {
  const reduced = useReducedMotion()
  const hero = variant === "hero"
  const [hot, setHot] = useState<string | null>(null)

  const label = new Date(year, monthIndex, 1).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    month: "long",
    year: "numeric",
  })

  const headers = weekdayLabels(weekStart, locale)
  const rows = useMemo(() => {
    const lead = buckets[0] ? weekPad(buckets[0].date, weekStart) : 0
    const cells: Array<DayBucket | null> = [...Array(lead).fill(null), ...buckets]
    while (cells.length % 7 !== 0) cells.push(null)
    const out: Array<Array<DayBucket | null>> = []
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7))
    return out
  }, [buckets, weekStart])

  const weekRowFilled = useMemo(
    () => rows.map((row) => row.some((b) => b != null && b.count > 0)),
    [rows]
  )

  const hotPct = hot ? returnPctByDate.get(hot) : undefined
  const hotDay = hot ? Number(hot.slice(-2)) : null
  const hotBucket = hot ? buckets.find((b) => b.date === hot) : undefined

  return (
    <div
      className={cn(
        "w-full",
        hero ? "max-w-full" : "max-w-[440px]",
        className
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-baseline justify-between gap-3 px-0.5",
          hero && "mb-4 sm:mb-5"
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-md text-foreground/45 hover:bg-foreground/5 hover:text-foreground",
              hero ? "text-xl" : "text-sm"
            )}
            aria-label={locale === "en" ? "Previous month" : "Bulan sebelumnya"}
            onClick={onPrev}
          >
            ‹
          </button>
          <span
            className={cn(
              "truncate font-medium capitalize text-foreground",
              hero ? "font-heading text-xl sm:text-2xl tracking-tight" : "text-[13px]"
            )}
          >
            {title ?? label}
          </span>
          <button
            type="button"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-md text-foreground/45 hover:bg-foreground/5 hover:text-foreground",
              hero ? "text-xl" : "text-sm"
            )}
            aria-label={locale === "en" ? "Next month" : "Bulan berikutnya"}
            onClick={onNext}
          >
            ›
          </button>
        </div>
        <span
          className={cn(
            "shrink-0 tabular-nums text-foreground/45",
            hero ? "text-xs sm:text-sm" : "text-xs"
          )}
        >
          {hot && hotDay != null ? (
            <>
              <span className="text-foreground">
                {hotDay} {label.split(" ")[0]}
              </span>
              {hotBucket && hotBucket.count > 0 && formatDayPnl ? (
                <>
                  <span className="mx-1.5 text-foreground/25">·</span>
                  <span style={{ color: hotBucket.pnl >= 0 ? GREEN : RED }}>
                    {formatDayPnl(hotBucket.pnl)}
                  </span>
                </>
              ) : hotPct != null && hotBucket && hotBucket.count > 0 ? (
                <>
                  <span className="mx-1.5 text-foreground/25">·</span>
                  <span style={{ color: hotPct >= 0 ? GREEN : RED }}>{signed(hotPct, 1)}%</span>
                </>
              ) : null}
            </>
          ) : hero && headerIdle ? (
            headerIdle
          ) : (
            hint ??
              (locale === "en"
                ? "hover day · Σ = week total (info only)"
                : "hover hari · Σ = total minggu (info saja)")
          )}
        </span>
      </div>

      <div
        className={cn("grid", hero ? "gap-1.5 sm:gap-2" : "gap-[3px]")}
        style={{
          gridTemplateColumns: hero
            ? "repeat(7, minmax(0, 1fr)) 2.75rem"
            : "repeat(7, minmax(0, 1fr)) 2.25rem",
        }}
        onPointerLeave={() => setHot(null)}
      >
        {headers.map((d) => (
          <span
            key={d}
            className={cn(
              "pb-1 text-center font-medium text-foreground/45",
              hero ? "text-xs" : "pb-0.5 text-[11px]"
            )}
          >
            {hero ? d : d.slice(0, 2)}
          </span>
        ))}
        <span
          className={cn(
            "pb-1 text-center font-normal text-foreground/35",
            hero ? "text-xs" : "pb-0.5 text-[11px]"
          )}
          title={locale === "en" ? "Week total (informational)" : "Total minggu (informasi)"}
        >
          Σ
        </span>

        {rows.map((row, ri) => {
          const weekBuckets = row.filter((b): b is DayBucket => b != null && b.count > 0)
          const weekReturns = weekBuckets.map((b) => returnPctByDate.get(b.date) ?? 0)
          const weekTotal = weekReturns.length ? compound(weekReturns) : 0
          const weekPnl = weekBuckets.reduce((acc, b) => acc + b.pnl, 0)
          const weekHasData = weekRowFilled[ri] ?? false
          const weekLabel = weekHasData ? weekBadgeText(weekPnl, weekTotal, formatDayPnl) : ""
          const showWeekSeparator =
            ri > 0 && weekHasData && (weekRowFilled[ri - 1] ?? false)

          return (
            <div key={ri} className="contents">
              {row.map((bucket, ci) => {
                if (!bucket) {
                  return <span key={`pad-${ri}-${ci}`} />
                }
                const day = Number(bucket.date.slice(-2))
                const r = returnPctByDate.get(bucket.date) ?? 0
                const hasTrade = bucket.count > 0
                const on = hot === bucket.date
                const focused = selectedDate === bucket.date
                const isToday = today === bucket.date
                const dim = !!hot && !on && hot !== bucket.date
                const tone = formatDayPnl ? bucket.pnl : r
                const toneForFill = formatDayPnl
                  ? tone === 0
                    ? 0
                    : tone > 0
                      ? Math.min(Math.abs(tone) / 10, 8)
                      : -Math.min(Math.abs(tone) / 10, 8)
                  : r

                return (
                  <motion.button
                    key={bucket.date}
                    type="button"
                    aria-label={`${bucket.date} ${hasTrade ? signed(r, 1) + "%" : "no trades"}`}
                    aria-pressed={focused}
                    aria-current={isToday ? "date" : undefined}
                    onPointerEnter={() => setHot(bucket.date)}
                    onFocus={() => setHot(bucket.date)}
                    onClick={() => onSelect(bucket.date)}
                    className={cn(
                      "grid w-full outline-none tabular-nums",
                      hero
                        ? "min-h-[4.25rem] sm:min-h-[5.25rem] md:min-h-[5.75rem] place-content-center gap-0.5 rounded-lg px-0.5 py-1.5 text-left sm:px-1"
                        : "aspect-square place-items-center rounded-[3px] text-[11px] font-semibold"
                    )}
                    style={{
                      background: hasTrade ? cellFill(toneForFill, on || focused) : "transparent",
                      color: hasTrade
                        ? `color-mix(in srgb, var(--foreground) ${Math.round(40 + Math.min(Math.abs(toneForFill) / 8, 1) * 45)}%, transparent)`
                        : "color-mix(in srgb, var(--foreground) 28%, transparent)",
                      outline:
                        on || focused || isToday
                          ? `1.5px solid ${hasTrade && tone !== 0 ? (tone >= 0 ? GREEN : RED) : "color-mix(in srgb, var(--foreground) 35%, transparent)"}`
                          : "none",
                      outlineOffset: "-1.5px",
                    }}
                    initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.6 }}
                    animate={{ opacity: dim ? 0.35 : 1, scale: 1 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.28, ease: EASE, delay: 0.006 * (ri * 7 + ci) }
                    }
                  >
                    {hero ? (
                      <>
                        <span className="w-full text-left text-sm font-semibold leading-none text-foreground/80 sm:text-base">
                          {day}
                        </span>
                        {hasTrade && formatDayPnl ? (
                          <span
                            className="w-full truncate text-left text-xs font-semibold leading-tight"
                            style={{ color: tone >= 0 ? GREEN : RED }}
                          >
                            {formatDayPnl(bucket.pnl)}
                          </span>
                        ) : hasTrade ? (
                          <span
                            className="w-full text-left text-xs font-medium"
                            style={{ color: tone >= 0 ? GREEN : RED }}
                          >
                            {signed(r, 1)}%
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold leading-none">{day}</span>
                    )}
                  </motion.button>
                )
              })}
              <div
                className={cn(
                  "flex items-center justify-center px-0.5 text-center",
                  hero ? "min-h-[4.25rem] sm:min-h-[5.25rem] md:min-h-[5.75rem]" : "min-h-[1.75rem]",
                  showWeekSeparator && "border-t border-foreground/12"
                )}
              >
                {weekHasData ? (
                  <span
                    className={cn(
                      "max-w-full truncate font-normal tabular-nums leading-tight text-foreground/45",
                      hero ? "text-xs" : "text-[11px]"
                    )}
                    title={
                      locale === "en"
                        ? `Week total: ${weekLabel} (not a target)`
                        : `Total minggu: ${weekLabel} (bukan target)`
                    }
                  >
                    {weekLabel}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { DailyReturnsCalendar as Component }
