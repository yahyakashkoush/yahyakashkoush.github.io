"use client";

import { projectTypes } from "@/content/inquiry";
import { Ask, ChoiceGroup, FieldError, InkAction, Sheet, SheetFoot, SheetHead } from "@/components/start/paper";
import type { StepProps } from "@/components/start/steps/types";
import type { ProjectTypeId } from "@/content/inquiry";

export function BriefStep({ value, patch, errors, onNext, step }: StepProps) {
  return (
    <Sheet>
      <SheetHead title="Project brief" step={step} />

      <Ask htmlFor="project-brief">What are you building?</Ask>

      <textarea
        id="project-brief"
        name="projectBrief"
        rows={5}
        value={value.projectBrief}
        onChange={(e) => patch({ projectBrief: e.target.value })}
        aria-invalid={!!errors.projectBrief}
        aria-describedby={errors.projectBrief ? "project-brief-error" : undefined}
        placeholder={"Tell me what you're trying to build,\nimprove, launch, or solve…"}
        className="ink-field field-sizing-content min-h-32 resize-none text-[1.0625rem] leading-relaxed"
      />
      <FieldError id="project-brief-error">{errors.projectBrief}</FieldError>

      <div className="mt-11">
        <ChoiceGroup
          legend="What kind of project is this?"
          name="projectTypes"
          choices={projectTypes}
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
