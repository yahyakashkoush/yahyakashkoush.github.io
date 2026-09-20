"use client";

import { usePortfolio } from "@/components/content-provider";
import { Ask, ChoiceGroup, FieldError, InkAction, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";
import type { ProjectTypeId } from "@/content/inquiry";

export function BriefStep({ value, patch, errors, onNext, step }: StepProps) {
  const { content: { start } } = usePortfolio();
  return (
    <Sheet>
      <SheetHead title={start.briefTitle} step={step} />

      <Ask htmlFor="project-brief">{start.briefQuestion}</Ask>

      <textarea
        id="project-brief"
        name="projectBrief"
        maxLength={12000}
        rows={5}
        value={value.projectBrief}
        onChange={(e) => patch({ projectBrief: e.target.value })}
        aria-invalid={!!errors.projectBrief}
        aria-describedby={errors.projectBrief ? "project-brief-error" : undefined}
        placeholder={start.briefPlaceholder}
        className="ink-field field-sizing-content min-h-32 resize-none text-[1.0625rem] leading-relaxed"
      />
      <FieldError id="project-brief-error">{errors.projectBrief}</FieldError>

      <div className="mt-11">
        <ChoiceGroup
          legend={start.typeQuestion}
          name="projectTypes"
          choices={start.projectTypes}
          value={value.projectTypes}
          onChange={(next) => patch({ projectTypes: next as ProjectTypeId[] })}
          multiple
          error={errors.projectTypes}
        />
        <p className="t-caption mt-3 text-[var(--ink-3)]">Choose as many as apply.</p>
      </div>

      <SheetFoot>
        <InkAction onClick={onNext}>Continue</InkAction>
      </SheetFoot>
    </Sheet>
  );
}
