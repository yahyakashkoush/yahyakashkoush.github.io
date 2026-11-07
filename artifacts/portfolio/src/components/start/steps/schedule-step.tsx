
import { useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react/dist/ssr";
import { usePortfolio } from "@/components/content-provider";
import { bookingService, mailHandoffProvider, type Availability } from "@/lib/booking";
import {
  formatTime,
  fromISODate,
  isRequestable,
  scheduleTimeZone,
  toISODate,
} from "@/lib/inquiry";
import { Ask, FieldError, InkAction, InkLabel, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";
import { cn } from "cn";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

/** Live availability is required; unavailable services never imply free slots. */
export function ScheduleStep({ value, patch, errors, onNext, onBack, step }: StepProps) {
  const { content: { start } } = usePortfolio();
  const scheduling = start.scheduling;
  const [month, setMonth] = useState(() => startOfMonth(value.date ? fromISODate(value.date) : new Date()));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [focusDate, setFocusDate] = useState<Date>(() => (value.date ? fromISODate(value.date) : new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  const zone = availability?.timeZone || scheduleTimeZone(scheduling);
  const today = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value;
    return fromISODate(`${get("year")}-${get("month")}-${get("day")}`);
  }, [zone]);

  useEffect(() => {
    let live = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await bookingService.getAvailability();
        if (live) { setAvailability(result); setAvailabilityError(""); }
      } catch (error) {
        if (live) { setAvailability(null); setAvailabilityError(error instanceof Error ? error.message : "Availability could not be checked."); }
      } finally { inFlight = false; }
    };
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      live = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [refreshKey]);

  useEffect(() => {
    if (availability && value.date && value.time && !availability.slotsByDate[value.date]?.includes(value.time)) {
      patch({ time: null });
    }
  }, [availability, value.date, value.time, patch]);

  const openable = (d: Date) => {
    if (!isRequestable(d, today, scheduling)) return false;
    return !!availability?.dates.includes(toISODate(d));
  };

  const slots = useMemo(() => {
    if (!value.date || !availability) return scheduling.slots as readonly string[];
    return [...new Set([...(availability.slotsByDate[value.date] || []), ...(availability.bookedByDate[value.date] || [])])].sort();
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
  const tabDate = cells.find((day) => day && sameDay(day, focusDate) && openable(day))
    ?? cells.find((day) => day && openable(day));

  return (
    <Sheet>
      <SheetHead title={start.scheduleTitle} step={step} />

      <Ask>{start.scheduleQuestion}</Ask>
      <p className="t-caption mb-5 text-[var(--ink-2)]">All appointments are shown in {zone}. A submitted brief reserves the time while meeting details are confirmed.</p>
      {availabilityError && (
        <div role="alert" className="mb-6 border border-red p-4 text-sm text-[var(--ink)]">
          <p>{availabilityError}</p>
          <button type="button" className="mt-3 min-h-11 underline" onClick={() => setRefreshKey((key) => key + 1)}>Retry availability</button>
          <button type="button" className="ml-5 mt-3 min-h-11 underline" onClick={() => { void mailHandoffProvider.submit(value); }}>Open an email draft instead</button>
          <p className="mt-2 text-xs">The email option opens your mail app with your brief. It does not reserve a meeting.</p>
        </div>
      )}
      {!availability && !availabilityError && <p role="status" className="t-caption mb-5">Checking live availability…</p>}

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
            const focused = !!tabDate && sameDay(d, tabDate);
            const fullyBooked = isRequestable(d, today, scheduling) && !enabled && (availability?.bookedByDate[id]?.length ?? 0) > 0;
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                data-day
                tabIndex={focused ? 0 : -1}
                disabled={!enabled}
                aria-selected={selected}
                aria-label={`${d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}${fullyBooked ? " — fully booked" : ""}`}
                onClick={() => pick(d)}
                className={cn(
                  "t-meta relative border-r border-b border-[var(--rule)] py-3 text-center transition-colors duration-200",
                  enabled
                    ? selected
                      ? "bg-red text-background"
                      : "text-[var(--ink-2)] hover:bg-[rgb(23_22_20_/_0.06)] hover:text-[var(--ink)]"
                    : "cursor-not-allowed text-[var(--ink-3)]/45",
                )}
              >
                {d.getDate()}
                {fullyBooked && <X aria-hidden className="absolute right-1 top-1 size-2.5" />}
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
            const booked = !!value.date && !!availability?.bookedByDate[value.date]?.includes(t);
            const enabled = !!value.date && !!availability?.slotsByDate[value.date]?.includes(t);
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!enabled}
                aria-label={`${formatTime(t)}${booked ? " — booked" : ""}`}
                onClick={() => patch({ time: t })}
                className={cn(
                  "t-meta min-h-11 bg-[var(--paper)] px-4 py-3 transition-colors duration-200",
                  selected
                    ? "bg-red text-background"
                    : "text-[var(--ink-2)] hover:bg-[rgb(23_22_20_/_0.06)] hover:text-[var(--ink)]",
                  !enabled && "cursor-not-allowed opacity-50 hover:bg-[var(--paper)]",
                )}
              >
                <span className={cn(booked && "line-through")}>{formatTime(t)}</span>
                {booked && <X aria-hidden className="ml-2 inline size-3.5" weight="bold" />}
              </button>
            );
          })}
        </div>
        <FieldError id="time-error">{errors.time}</FieldError>

        <p className="t-caption mt-4 max-w-[52ch] text-[var(--ink-3)]">
          {value.date
            ? `Times shown in ${zone}. × means already booked. `
            : "Choose a day first. "}
          Availability refreshes automatically. A time is reserved only after your brief is accepted.
        </p>
      </div>

      <SheetFoot onBack={onBack}>
        <InkAction onClick={onNext} disabled={!availability || !value.date || !value.time || !availability.slotsByDate[value.date]?.includes(value.time)}>Review brief</InkAction>
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
