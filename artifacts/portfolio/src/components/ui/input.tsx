import * as React from "react";
import { cn } from "cn";

/**
 * shadcn Input, restyled to the site language: no box, no fill, a single
 * hairline underneath that turns red on focus.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 border-0 border-b border-line bg-transparent py-3 text-base text-foreground outline-none transition-colors duration-300",
        "placeholder:text-fg-3 focus-visible:border-red",
        "aria-invalid:border-red disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
