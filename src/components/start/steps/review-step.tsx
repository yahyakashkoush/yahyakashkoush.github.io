"use client";

import { bookingService } from "@/lib/booking";
import {
  budgetLabel,
  formatLongDate,
  formatTime,
  resolvedTimeZone,
  typeLabels,
  type Errors,
  type ProjectInquiry,
  type StepId,
} from "@/lib/inquiry";
import { InkAction, InkBack, Sheet } from "@/components/start/paper";

/**
 * The finished brief, set as a document rather than a confirmation panel:
 * ruled entries, mono field names, the answers in ink. Each entry can be
 * reopened, so nothing here is a dead end.
 */
export function ReviewStep({
  value,
  errors,
  onEdit,
  onSeal,
  onBack,
}: {
  value: ProjectInquiry;
  errors: Errors;
  onEdit: (step: StepId) => void;
  onSeal: () => void;
  onBack: () => void;
}) {
  const blocked = Object.keys(errors).length > 0;

  return (
    <Sheet>
      <div className="mb-9 border-b border-[var(--rule-2)] pb-4">
        <h2 className="t-label text-[var(--ink)]">Project brief</h2>
      </div>

      <dl className="flex flex-col">
        <Entry label="Project" onEdit={() => onEdit("brief")}>
          <p className="whitespace-pre-line">{value.projectBrief.trim()}</p>
        </Entry>

        <Entry label="Type" onEdit={() => onEdit("brief")}>
          {typeLabels(value.projectTypes)}
        </Entry>

        <Entry label="Investment" onEdit={() => onEdit("budget")}>
          {budgetLabel(value.budget)}
        </Entry>

        <Entry label="Contact" onEdit={() => onEdit("contact")}>
          <span className="block">{value.name.trim()}</span>
          <span className="block">{value.email.trim()}</span>
          {value.company.trim() && <span className="block text-[var(--ink-2)]">{value.company.trim()}</span>}
        </Entry>

        <Entry label="Meeting" onEdit={() => onEdit("schedule")}>
          {value.date && value.time ? (
            <>
              <span className="block">{formatLongDate(value.date)}</span>
              <span className="block">
                {formatTime(value.time)}
                <span className="text-[var(--ink-3)]"> · {resolvedTimeZone()}</span>
              </span>
            </>
          ) : (
            <span className="text-[var(--ink-3)]">Not set</span>
          )}
        </Entry>
      </dl>

      {!bookingService.confirmsBookings && (
        <p className="t-caption mt-8 max-w-[54ch] border-l border-red pl-4 text-[var(--ink-2)]">
          Sending opens a message in your own mail client with this brief in it — nothing is transmitted from this
          page. The meeting time travels as a request and is confirmed by reply.
        </p>
      )}

      {blocked && (
        <p role="alert" className="t-meta mt-6 text-red">
          Something above is still incomplete. Open the entry to finish it.
        </p>
      )}

      <div className="mt-10 flex flex-col gap-6 border-t border-[var(--rule)] pt-7 sm:flex-row sm:items-center sm:justify-between">
        <InkBack onClick={onBack}>Back</InkBack>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="t-label text-[var(--ink-3)]">Ready to send?</span>
          <InkAction onClick={onSeal} disabled={blocked}>
            Seal the brief
          </InkAction>
        </div>
      </div>
    </Sheet>
  );
}

function Entry({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 border-b border-[var(--rule)] py-5 sm:grid-cols-[9rem_1fr_auto]">
      <dt className="t-label pt-1 text-[var(--ink-3)]">{label}</dt>
      <dd className="text-[0.9375rem] leading-relaxed text-[var(--ink)]">{children}</dd>
      <button
        type="button"
        onClick={onEdit}
        className="t-label link-wipe justify-self-start pt-1 text-[var(--ink-3)] transition-colors duration-200 hover:text-red sm:justify-self-end"
      >
        Edit<span className="sr-only"> {label}</span>
      </button>
    </div>
  );
}
