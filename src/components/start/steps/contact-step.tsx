"use client";

import { Ask, InkAction, InkField, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";

/**
 * No phone field. The site publishes an email address and a LinkedIn profile
 * and no number, so asking for one would offer a reply channel that does not
 * exist on this end.
 */
export function ContactStep({ value, patch, errors, onNext, onBack, step }: StepProps) {
  return (
    <Sheet>
      <SheetHead title="Your details" step={step} />

      <Ask>Where should I send the reply?</Ask>

      <div className="flex flex-col gap-8">
        <InkField id="name" label="Name" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={value.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="ink-field text-[1.0625rem]"
          />
        </InkField>

        <InkField id="email" label="Email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={value.email}
            onChange={(e) => patch({ email: e.target.value })}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="ink-field text-[1.0625rem]"
          />
        </InkField>

        <InkField id="company" label="Company / Studio" optional>
          <input
            id="company"
            name="company"
            autoComplete="organization"
            value={value.company}
            onChange={(e) => patch({ company: e.target.value })}
            className="ink-field text-[1.0625rem]"
          />
        </InkField>
      </div>

      <SheetFoot onBack={onBack}>
        <InkAction onClick={onNext}>Continue</InkAction>
      </SheetFoot>
    </Sheet>
  );
}
