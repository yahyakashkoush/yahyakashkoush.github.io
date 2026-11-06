import type { Errors, ProjectInquiry } from "@/lib/inquiry";

export type StepProps = {
  value: ProjectInquiry;
  /** Merges a partial into the inquiry. Data survives moving between steps. */
  patch: (next: Partial<ProjectInquiry>) => void;
  errors: Errors;
  onNext: () => void;
  onBack: () => void;
  step: { n: number; of: number };
};
