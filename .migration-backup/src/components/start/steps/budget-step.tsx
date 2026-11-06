"use client";

import { type BudgetId } from "@/content/inquiry";
import { usePortfolio } from "@/components/content-provider";
import { Ask, ChoiceGroup, InkAction, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";

export function BudgetStep({ value, patch, errors, onNext, onBack, step }: StepProps) {
  const { content: { start } } = usePortfolio();
  return (
    <Sheet>
      <SheetHead title={start.budgetTitle} step={step} />

      <Ask>{start.budgetQuestion}</Ask>

      <ChoiceGroup
        legend="Select one"
        name="budget"
        choices={start.budgetBands}
        value={value.budget ? [value.budget] : []}
        onChange={(next) => patch({ budget: (next[0] ?? null) as BudgetId | null })}
        error={errors.budget}
        columns={1}
      />

      <p className="t-caption mt-6 max-w-[48ch] text-[var(--ink-3)]">
        {start.budgetHelp}
      </p>

      <SheetFoot onBack={onBack}>
        <InkAction onClick={onNext}>Continue</InkAction>
      </SheetFoot>
    </Sheet>
  );
}
