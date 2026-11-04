import DOMPurify from "dompurify";

/*
   SVG SANITIZER
   category icons come from the API as raw svg strings and are rendered with
   dangerouslySetInnerHTML, so a <script> or onload="" inside them would run on every visitor.
   only the svg profile is allowed: no scripts, no event handlers, no foreignObject.
*/
export const sanitizeSvg = (svg?: string | null): string => {
  if (!svg) return "";

  // DOMPurify needs a real DOM; on the server we render nothing and let the client fill it in
  if (typeof window === "undefined" || !DOMPurify.isSupported) return "";

  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject", "style"],
  });
};
