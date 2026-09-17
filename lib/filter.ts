import type { Inspiration, Tag } from "./types";
import { colorDistance } from "./image";

export type SortKey = "recent" | "oldest" | "az";

/** Search = title, URL, tag name, font (IA §5). Color search = image palette only, never tag colors (IA §23). */
export function filterInspirations(
  items: Inspiration[],
  opts: {
    query?: string; color?: string | null; tag?: string | null; tags?: string[]; sort?: SortKey;
    tagById?: Map<string, Tag>; tolerance?: number; caseStudy?: boolean; onDate?: number | null;
  }
) {
  const q = (opts.query ?? "").trim().toLowerCase();
  const tol = opts.tolerance ?? 150;
  let out = items.filter((i) => {
    if (opts.tag && !i.tags.includes(opts.tag)) return false;
    if (opts.tags?.length && !opts.tags.some((t) => i.tags.includes(t))) return false;
    if (opts.caseStudy && !(i.scheduledDate || i.readingStatus === "completed")) return false;
    if (opts.onDate != null) {
      const when = i.readingStatus === "completed" ? i.completedDate : i.scheduledDate;
      if (!when || !sameDay(when, opts.onDate)) return false;
    }
    if (opts.color && !i.palette.some((p) => colorDistance(p, opts.color!) <= tol)) return false;
    if (!q) return true;
    const hay = [
      i.title,
      i.sourceUrl,
      i.note,
      ...i.fonts,
      ...i.keywords,
      ...i.tags.map((t) => opts.tagById?.get(t)?.name ?? ""),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
  if (opts.color) {
    const best = (i: Inspiration) => Math.min(...i.palette.map((p) => colorDistance(p, opts.color!)));
    out = out.sort((a, b) => best(a) - best(b));
  } else if (opts.sort === "oldest") out = [...out].sort((a, b) => a.createdAt - b.createdAt);
  else if (opts.sort === "az") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export function sameDay(a: number, b: number) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
export function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
