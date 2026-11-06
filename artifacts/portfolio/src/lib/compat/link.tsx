import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link as WouterLink } from "wouter";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; prefetch?: boolean; scroll?: boolean; replace?: boolean };

/** Replacement for next/link. Hash links and external URLs use plain anchors; internal paths use wouter. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _p, scroll: _s, replace, ...rest }, ref) {
  const plain = href.includes("#") || /^(https?:|mailto:|tel:)/.test(href) || href.includes("?");
  if (plain) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = href.startsWith("/") ? base + href : href;
    return <a ref={ref} href={url} {...rest} />;
  }
  return <WouterLink ref={ref} href={href} replace={replace} {...rest} />;
});
export default Link;
