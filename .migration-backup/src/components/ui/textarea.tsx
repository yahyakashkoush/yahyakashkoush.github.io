import * as React from "react";
import { cn } from "cn";

/** shadcn Textarea, restyled to match Input: hairline underneath, no box. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-24 w-full resize-none border-0 border-b border-line bg-transparent py-3 text-base text-foreground outline-none transition-colors duration-300",
        "placeholder:text-fg-3 focus-visible:border-red",
        "aria-invalid:border-red disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
