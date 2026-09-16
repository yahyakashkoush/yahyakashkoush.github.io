"use client";

import { budgetBands, type BudgetId } from "@/content/inquiry";
import { Ask, ChoiceGroup, InkAction, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";

export function BudgetStep({ value, patch, errors, onNext, onBack, step }: StepProps) {
  return (
    <Sheet>
      <SheetHead title="Investment" step={step} />

      <Ask>What&rsquo;s the expected investment?</Ask>

      <ChoiceGroup
        legend="Select one"
        name="budget"
        choices={budgetBands}
        value={value.budget ? [value.budget] : []}
        onChange={(next) => patch({ budget: (next[0] ?? null) as BudgetId | null })}
        error={errors.budget}
        columns={1}
      />

      <p className="t-caption mt-6 max-w-[48ch] text-[var(--ink-3)]">
        A range is enough. It sets the shape of what&rsquo;s possible before we talk.
      </p>

      <SheetFoot onBack={onBack}>
        <InkAction onClick={onNext}>Continue</InkAction>
      </SheetFoot>
    </Sheet>
  );
}
