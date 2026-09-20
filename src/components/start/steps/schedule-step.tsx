"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { usePortfolio } from "@/components/content-provider";
import { bookingService, type Availability } from "@/lib/booking";
import {
  formatTime,
  fromISODate,
  isRequestable,
  resolvedTimeZone,
  toISODate,
} from "@/lib/inquiry";
import { Ask, FieldError, InkAction, InkLabel, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";
import { cn } from "cn";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

/**
 * A printed appointment sheet, not a scheduling dashboard.
 *
 * The site has no calendar integration, so nothing here is presented as a free
 * slot. `bookingService.getAvailability()` returns null under the shipped mail
 * handoff and the grid stays a list of *preferred* times, labelled as such.
 * Connect a provider and the same grid narrows to whatever it publishes.
 */
export function ScheduleStep({ value, patch, errors, onNext, onBack, step }: StepProps) {
  const { content: { start } } = usePortfolio();
  const scheduling = start.scheduling;
  const [month, setMonth] = useState(() => startOfMonth(value.date ? fromISODate(value.date) : new Date()));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [focusDate, setFocusDate] = useState<Date>(() => (value.date ? fromISODate(value.date) : new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let live = true;
    bookingService.getAvailability().then((a) => live && setAvailability(a));
    return () => {
      live = false;
    };
  }, []);

  const openable = (d: Date) => {
    if (!isRequestable(d, today, scheduling)) return false;
    return availability ? availability.dates.includes(toISODate(d)) : true;
  };

  const slots = useMemo(() => {
    if (!value.date) return scheduling.slots as readonly string[];
    return availability?.slotsByDate[value.date] ?? (scheduling.slots as readonly string[]);
  }, [availability, value.date, scheduling.slots]);

  /* Grid cells, padded to whole weeks. */
  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const lead = first.getDay();
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= days; i++) out.push(new Date(month.getFullYear(), month.getMonth(), i));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  // Roving focus: only the focused day is tabbable, arrows move between days.
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')?.focus();
  }, [focusDate, month]);

  const moveFocus = (deltaDays: number) => {
    const next = new Date(focusDate);
    next.setDate(next.getDate() + deltaDays);
    shouldFocus.current = true;
    setFocusDate(next);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(startOfMonth(next));
    }
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(map[e.key]);
    }
  };

  const pick = (d: Date) => {
    const next = toISODate(d);
    // Changing day clears a time that the new day may not offer.
    patch({ date: next, time: value.date === next ? value.time : null });
    setFocusDate(d);
  };

  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Sheet>
      <SheetHead title={start.scheduleTitle} step={step} />

      <Ask>{start.scheduleQuestion}</Ask>

      {/* Calendar --------------------------------------------------------- */}
      <div className="border-t border-[var(--rule-2)] pt-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <span className="t-meta text-[var(--ink)]" aria-live="polite">
            {monthLabel}
          </span>
          <div className="flex items-center">
            <MonthButton label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <CaretLeft weight="bold" className="size-3.5" />
            </MonthButton>
            <MonthButton label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <CaretRight weight="bold" className="size-3.5" />
            </MonthButton>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-[var(--rule)]">
          {WEEKDAY_INITIALS.map((w, i) => (
            <div
              key={i}
              aria-hidden
              className="t-label border-r border-b border-[var(--rule)] py-2.5 text-center text-[var(--ink-3)]"
            >
              {w}
            </div>
          ))}
        </div>

        <div
          ref={gridRef}
          role="grid"
          aria-label="Preferred meeting date"
          onKeyDown={onGridKeyDown}
          className="grid grid-cols-7 border-l border-[var(--rule)]"
        >
          {cells.map((d, i) => {
            if (!d) return <span key={i} role="gridcell" className="border-r border-b border-[var(--rule)]" />;
            const id = toISODate(d);
            const selected = value.date === id;
            const enabled = openable(d);
            const focused = sameDay(d, focusDate);
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                data-day
                tabIndex={focused ? 0 : -1}
                disabled={!enabled}
                aria-selected={selected}
                aria-label={d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                onClick={() => pick(d)}
                className={cn(
                  "t-meta relative border-r border-b border-[var(--rule)] py-3 text-center transition-colors duration-200",
                  enabled
                    ? selected
                      ? "bg-red text-white"
                      : "text-[var(--ink-2)] hover:bg-[rgb(23_22_20_/_0.06)] hover:text-[var(--ink)]"
                    : "cursor-not-allowed text-[var(--ink-3)]/45",
                )}
              >
                {d.getDate()}
                {sameDay(d, today) && !selected && (
                  <span aria-hidden className="absolute inset-x-0 bottom-1.5 mx-auto block size-1 bg-red" />
                )}
              </button>
            );
          })}
        </div>
        <FieldError id="date-error">{errors.date}</FieldError>
      </div>

      {/* Times ------------------------------------------------------------ */}
      <div className="mt-9">
        <InkLabel>Preferred time</InkLabel>
        <div
          role="radiogroup"
          aria-label="Preferred meeting time"
          className="grid grid-cols-2 gap-px bg-[var(--rule)] sm:grid-cols-3 lg:grid-cols-4"
        >
          {slots.map((t) => {
            const selected = value.time === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!value.date}
                onClick={() => patch({ time: t })}
                className={cn(
                  "t-meta min-h-11 bg-[var(--paper)] px-4 py-3 transition-colors duration-200",
                  selected
                    ? "bg-red text-white"
                    : "text-[var(--ink-2)] hover:bg-[rgb(23_22_20_/_0.06)] hover:text-[var(--ink)]",
                  !value.date && "cursor-not-allowed opacity-40 hover:bg-[var(--paper)]",
                )}
              >
                {formatTime(t)}
              </button>
            );
          })}
        </div>
        <FieldError id="time-error">{errors.time}</FieldError>

        <p className="t-caption mt-4 max-w-[52ch] text-[var(--ink-3)]">
          {value.date
            ? `Times shown in ${resolvedTimeZone()}. `
            : "Choose a day first. "}
          {bookingService.confirmsBookings
            ? "Slots shown are open."
            : start.scheduleHelp}
        </p>
      </div>

      <SheetFoot onBack={onBack}>
        <InkAction onClick={onNext}>Review brief</InkAction>
      </SheetFoot>
    </Sheet>
  );
}

function MonthButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center text-[var(--ink-2)] transition-colors duration-200 hover:text-red"
    >
      {children}
    </button>
  );
}
