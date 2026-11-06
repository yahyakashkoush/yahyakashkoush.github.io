import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string | { src: string };
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
};

/** Drop-in replacement for next/image: renders a plain <img> with equivalent sizing/loading. */
export default function Image({ src, fill, priority, quality: _q, unoptimized: _u, placeholder: _p, blurDataURL: _b, style, loading, width, height, ...rest }: Props) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", color: "transparent" }
    : { color: "transparent" };
  return (
    <img
      {...rest}
      src={typeof src === "string" ? src : src.src}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      style={{ ...fillStyle, ...style }}
    />
  );
}
