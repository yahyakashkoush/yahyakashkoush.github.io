import "./automation-flow.css";

const STEPS = [
  { step: "01", name: "Trigger" },
  { step: "02", name: "Reason" },
  { step: "03", name: "Act" },
  { step: "04", name: "Verify" },
];

/** A quiet pipeline diagram: a signal travels trigger to verification. Decorative. */
export function AutomationFlow({ className }: { className?: string }) {
  return (
    <div className={`af ${className ?? ""}`} aria-hidden data-testid="automation-flow">
      <div className="af-track">
        <span className="af-rail" />
        {STEPS.map((s, i) => (
          <div key={s.step} className="af-node" style={{ ["--af-delay" as string]: `${i * 0.95}s` }}>
            <span className="af-dot" />
            <span className="t-label af-step">{s.step}</span>
            <span className="af-name">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
