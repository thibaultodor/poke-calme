// Modifié pour Poké Calme (2026) : adaptation CP, voir NOTICE.md.
/** GitHub Pages supplies its real URL during the build. */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5173";
export const PAGES = ["/", "/about", "/privacy"] as const;
export type PagePath = (typeof PAGES)[number];
export const PREVIEW_IMAGE = SITE_URL + "/og-image.png";
export function absoluteUrl(path: PagePath): string {
  return SITE_URL + (path === "/" ? "/" : path + "/");
}
