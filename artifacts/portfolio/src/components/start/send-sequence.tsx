import { useCallback, useEffect, useRef, useState } from "react";
import { Envelope, LetterSheet } from "@/components/start/envelope";

type Stage = "ready" | "inserting" | "closing" | "sealed";
const LABELS: Record<Stage, string> = {
  ready: "Preparing your brief",
  inserting: "Enclosing your brief",
  closing: "Closing the envelope",
  sealed: "Sending your brief",
};

/**
 * Each physical movement hands off to the next on completion. There is no
 * guessed timeline to drift, clip a letter, or start a flap before it is ready.
 */
export function SendSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>("ready");
  const completed = useRef(false);
  useEffect(() => {
    // One frame lets the open envelope paint before the letter moves inside.
    const frame = requestAnimationFrame(() => setStage("inserting"));
    return () => cancelAnimationFrame(frame);
  }, []);
  const letterComplete = useCallback(() => {
    setStage((current) => current === "inserting" ? "closing" : current);
  }, []);
  const flapComplete = useCallback(() => {
    setStage((current) => current === "closing" ? "sealed" : current);
  }, []);
  const sealComplete = useCallback(() => {
    if (stage !== "sealed" || completed.current) return;
    completed.current = true;
    onComplete();
  }, [stage, onComplete]);

  return (
    <section className="mx-auto w-full max-w-[42rem] py-12" role="status" aria-live="polite" aria-atomic="true">
      <div className="mx-auto mb-12 w-full max-w-[20rem] pt-20">
        <Envelope
          state={stage === "closing" || stage === "sealed" ? "closed" : "open"}
          sealed={stage === "sealed"}
          letterOut={stage === "ready"}
          letter={<LetterSheet />}
          onLetterComplete={letterComplete}
          onFlapComplete={flapComplete}
          onSealComplete={sealComplete}
        />
      </div>
      <p className="t-label mb-4 text-fg-3">Project inquiry</p>
      <h1 className="t-sub text-foreground">{LABELS[stage]}</h1>
      <p className="t-caption mt-4 text-fg-2">Your request is complete only when delivery is confirmed.</p>
    </section>
  );
}
