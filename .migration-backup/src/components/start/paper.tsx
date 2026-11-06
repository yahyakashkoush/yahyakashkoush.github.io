"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";

/**
 * The letter's own small design system.
 *
 * Everything here is the dark site inverted onto stock: ink for type, ruled
 * lines instead of input boxes, and the same red used for state only. Kept
 * separate from src/components/ui so the dark primitives are untouched.
 */

/* Sheet ------------------------------------------------------------------- */

export function Sheet({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("paper paper-edge w-full px-7 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-14", className)}>
      {children}
    </div>
  );
}

/** Running head: what this page of the brief is, and where it sits in the set. */
export function SheetHead({ title, step }: { title: string; step?: { n: number; of: number } }) {
  return (
    <div className="mb-9 flex items-baseline justify-between gap-6 border-b border-[var(--rule)] pb-4">
      <h2 className="t-label text-[var(--ink)]">{title}</h2>
      {step && (
        <span className="t-label text-[var(--ink-3)]" aria-hidden>
          {String(step.n).padStart(2, "0")} / {String(step.of).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

/** The one large question per page. */
export function Ask({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  const cls = "t-sub mb-7 block max-w-[22ch] text-[var(--ink)]";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls}>
      {children}
    </label>
  ) : (
    <p className={cls}>{children}</p>
  );
}

export function InkLabel({ children, as = "span" }: { children: React.ReactNode; as?: "span" | "legend" }) {
  const Tag = as;
  return <Tag className="t-label mb-4 block text-[var(--ink-3)]">{children}</Tag>;
}

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="t-meta mt-2.5 text-red">
      {children}
    </p>
  );
}

/* Ruled field ------------------------------------------------------------- */

export function InkField({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="t-label mb-1 text-[var(--ink-3)]">
        {label}
        {optional && <span className="ml-2 normal-case opacity-70">(optional)</span>}
      </label>
      {children}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/* Choices ----------------------------------------------------------------- */

export type Choice = { id: string; label: string; note?: string };

/**
 * Real inputs under an editorial mark, so keyboard, screen readers and form
 * semantics all behave. Radios for a single answer, checkboxes for several.
 */
export function ChoiceGroup({
  legend,
  name,
  choices,
  value,
  onChange,
  multiple = false,
  error,
  columns = 2,
}: {
  legend: string;
  name: string;
  choices: readonly Choice[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  error?: string;
  columns?: 1 | 2;
}) {
  const toggle = (id: string) => {
    if (!multiple) return onChange([id]);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <InkLabel as="legend">{legend}</InkLabel>
      <div className={cn("grid gap-x-8 gap-y-0", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>
        {choices.map((c) => {
          const checked = value.includes(c.id);
          return (
            <label
              key={c.id}
              className="group flex cursor-pointer items-start gap-3.5 border-b border-[var(--rule)] py-3.5 transition-colors duration-200 hover:border-[var(--rule-2)]"
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={c.id}
                checked={checked}
                onChange={() => toggle(c.id)}
                className="peer sr-only"
              />
              {/* Mark. Square, sharp, fills red when chosen. */}
              <span
                aria-hidden
                className={cn(
                  "mt-[3px] block size-3 shrink-0 border transition-[background-color,border-color] duration-200",
                  checked ? "border-red bg-red" : "border-[var(--rule-2)] group-hover:border-[var(--ink-3)]",
                  "peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red",
                )}
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    "t-meta block transition-colors duration-200",
                    checked ? "text-[var(--ink)]" : "text-[var(--ink-2)]",
                  )}
                >
                  {c.label}
                </span>
                {c.note && <span className="t-caption mt-1 block text-[var(--ink-3)]">{c.note}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={`${name}-error`}>{error}</FieldError>
    </fieldset>
  );
}

/* Actions ----------------------------------------------------------------- */

/** Primary control on paper: ink stroke that floods red. */
export function InkAction({
  children,
  onClick,
  type = "button",
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group t-nav inline-flex min-h-12 items-center justify-center gap-3 border border-[var(--ink)] px-7 text-[var(--ink)]",
        "transition-[background-color,color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-red hover:bg-red hover:text-white active:translate-y-px",
        "disabled:pointer-events-none disabled:opacity-35",
        className,
      )}
    >
      {children}
      <ArrowRight weight="bold" className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
    </button>
  );
}

/** Quiet return control. Never competes with the primary. */
export function InkBack({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group t-nav inline-flex min-h-11 items-center gap-2.5 text-[var(--ink-3)] transition-colors duration-300 hover:text-[var(--ink)]"
    >
      <ArrowLeft weight="bold" className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
      {children}
    </button>
  );
}

/** Foot of every page of the brief. */
export function SheetFoot({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-10 flex items-center justify-between gap-6 border-t border-[var(--rule)] pt-7">
      {onBack ? <InkBack onClick={onBack}>Back</InkBack> : <span />}
      {children}
    </div>
  );
}
