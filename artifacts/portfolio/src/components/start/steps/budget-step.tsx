
import { type BudgetId } from "@/content/inquiry";
import { usePortfolio } from "@/components/content-provider";
import { Ask, ChoiceGroup, FieldError, InkAction, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
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
        choices={[...start.budgetBands, { id: "__custom__", label: "Set my own budget", note: "An amount or range, in your currency." }]}
        value={value.budget ? [value.budget] : []}
        onChange={(next) => patch({ budget: (next[0] ?? null) as BudgetId | null })}
        error={value.budget === "__custom__" ? undefined : errors.budget}
        columns={1}
      />

      {value.budget === "__custom__" && (
        <div className="mt-6">
          <label className="t-label mb-3 block text-[var(--ink-2)]" htmlFor="custom-budget">Your budget & currency</label>
          <input
            id="custom-budget"
            name="customBudget"
            type="text"
            maxLength={120}
            placeholder="e.g. $750 or EGP 30,000–50,000"
            value={value.customBudget}
            onChange={(event) => patch({ customBudget: event.target.value })}
            aria-invalid={!!errors.budget}
            aria-describedby={errors.budget ? "custom-budget-error" : undefined}
            className="ink-field text-base"
          />
          <FieldError id="custom-budget-error">{errors.budget}</FieldError>
        </div>
      )}

      <p className="t-caption mt-6 max-w-[48ch] text-[var(--ink-3)]">
        {start.budgetHelp}
      </p>

      <SheetFoot onBack={onBack}>
        <InkAction onClick={onNext}>Continue</InkAction>
      </SheetFoot>
    </Sheet>
  );
}
