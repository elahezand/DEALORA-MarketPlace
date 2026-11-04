"use client";

import { useMemo, useSyncExternalStore } from "react";
import { sanitizeSvg } from "@/utils/sanitizeSvg";

interface SafeSvgProps extends Omit<React.HTMLAttributes<HTMLElement>, "dangerouslySetInnerHTML"> {
  svg?: string | null;
  as?: "div" | "span";
}

const subscribe = () => () => {};

/* renders an svg string from the API after sanitizing it (see utils/sanitizeSvg) */
export default function SafeSvg({ svg, as = "div", ...rest }: SafeSvgProps) {
  // false on the server and during hydration, true afterwards — server html and first client render match
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const html = useMemo(() => (isClient ? sanitizeSvg(svg) : ""), [isClient, svg]);

  const Tag = as;
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}
