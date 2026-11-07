import { useEffect, useRef } from "react";
import { LiquidEther } from "@/components/liquid-ether";
import "./site-smoke.css";

/** One viewport-sized background follows every public page, including its footer. */
export function SiteSmoke() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const visibility = () => ref.current?.setAttribute("data-paused", String(document.hidden));
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="site-smoke" data-testid="site-smoke">
      <div className="site-smoke__haze" />
      <LiquidEther
        className="site-smoke__fluid"
        colors={["#20252b", "#9baebf", "#343e48"]}
        mouseForce={12}
        cursorSize={110}
        resolution={0.3}
        iterationsPoisson={18}
        maxFPS={30}
        pixelRatioLimit={1.5}
        autoDemo
        autoSpeed={0.28}
        autoIntensity={1.5}
        autoResumeDelay={2400}
        autoRampDuration={0.8}
      />
      <div className="site-smoke__veil" />
    </div>
  );
}
