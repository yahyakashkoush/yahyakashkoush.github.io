import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { ArrowDown, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

/* Layout ------------------------------------------------------------------ */

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-6 lg:px-10", className)}>{children}</div>;
}

/** Full-bleed hairline. The only divider on the site. */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("h-px w-full border-0 bg-line", className)} />;
}

/* Type -------------------------------------------------------------------- */

/**
 * Small mono label above a section heading. Deliberately rare: the page uses
 * three of these in total, and the hero has none.
 */
export function Kicker({
  children,
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  /** Pass "h2" where the kicker IS the section heading, as on case studies. */
  as?: "span" | "h2";
}) {
  return <Tag className={cn("t-label block font-medium text-fg-3", className)}>{children}</Tag>;
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return <Tag className={cn("t-section text-foreground", className)}>{children}</Tag>;
}

/* Tags -------------------------------------------------------------------- */

/** Sharp bracketed technology tag. Replaces the shadcn pill badge entirely. */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="t-label inline-flex items-center border border-line px-2.5 py-1.5 text-fg-3 transition-colors duration-200 hover:border-line-red hover:text-foreground">
      {children}
    </span>
  );
}

/* Buttons ----------------------------------------------------------------- */

const action = cva(
  "group inline-flex min-h-12 items-center justify-center gap-3 t-nav transition-[background-color,color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        /* White stroke that floods red on hover. The only filled control on the site. */
        solid:
          "border border-foreground px-7 text-foreground hover:border-red hover:bg-red hover:text-white",
        /* Quiet sibling. Stroke stays neutral, text warms. Held at white/25 so
           the control boundary is still legible over the hero footage. */
        outline: "border border-white/25 px-7 text-fg-2 hover:border-foreground hover:text-foreground",
      },
      block: { true: "w-full", false: "w-auto" },
    },
    defaultVariants: { variant: "solid", block: false },
  },
);

type ActionProps = VariantProps<typeof action> & {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  /** `down` for same-page scroll targets, `right` for internal routes. */
  direction?: "up-right" | "down" | "right";
};

const ARROWS = {
  "up-right": { Icon: ArrowUpRight, hover: "group-hover:translate-x-0.5 group-hover:-translate-y-0.5" },
  down: { Icon: ArrowDown, hover: "group-hover:translate-y-0.5" },
  right: { Icon: ArrowRight, hover: "group-hover:translate-x-0.5" },
} as const;

export function Action({ href, children, variant, block, className, external, direction }: ActionProps) {
  const cls = cn(action({ variant, block }), className);
  const { Icon, hover } = ARROWS[direction ?? (external ? "up-right" : "right")];
  const body = (
    <>
      {children}
      <Icon
        weight="bold"
        className={cn(
          "size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          hover,
        )}
      />
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

/* Links ------------------------------------------------------------------- */

/** Inline text link. Underline wipes in from the left; arrow only when external. */
export function TextLink({
  href,
  children,
  external,
  className,
  arrow = true,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
  arrow?: boolean;
}) {
  const cls = cn(
    // min-h-6 keeps small mono links at the WCAG 2.5.8 target minimum.
    "link-wipe group inline-flex min-h-6 items-center gap-1.5 text-foreground transition-colors duration-300 hover:text-red",
    className,
  );
  const body = (
    <>
      {children}
      {arrow && (
        <ArrowUpRight
          weight="bold"
          className="size-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

/* Prose ------------------------------------------------------------------- */

export function Prose({ blocks, className }: { blocks: string[]; className?: string }) {
  return (
    <div className={cn("flex max-w-[62ch] flex-col gap-5", className)}>
      {blocks.map((b, i) => (
        <p key={i} className="t-body">
          {b}
        </p>
      ))}
    </div>
  );
}
