import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "@/lib/safe-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif",
  "ui-monospace", "ui-rounded", "inherit", "initial", "unset", "revert", "emoji", "math", "fangsong",
  "-apple-system", "blinkmacsystemfont", "segoe ui", "helvetica neue", "helvetica", "arial", "apple color emoji",
  "segoe ui emoji", "segoe ui symbol", "noto color emoji", "var", "none", "sans", "roboto fallback",
]);

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

function metaContent(html: string, key: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  return tag ? decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "") : "";
}

function cleanFont(f: string) {
  const name = f.replace(/!important/g, "").replace(/["']/g, "").trim();
  if (!name || name.startsWith("var(") || name.startsWith("--") || name.length > 40) return "";
  if (GENERIC.has(name.toLowerCase())) return "";
  if (/fallback|placeholder|icon|awesome|material symbols/i.test(name)) return "";
  // next/font hashed names like "__Inter_d65c78" → "Inter"
  const m = name.match(/^__([A-Za-z0-9]+(?:_[A-Za-z]+)*?)_[0-9a-f]{5,}$/);
  return m ? m[1].replace(/_/g, " ") : name;
}

/** Meta only serves og: tags to whitelisted crawlers; a browser UA gets the login wall instead. */
const META_HOSTS = /(?:^|\.)(?:instagram\.com|facebook\.com|fb\.com|fb\.watch|threads\.net|threads\.com)$/i;
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const META_CDN = /^https?:\/\/[^/]*(?:cdninstagram\.com|fbcdn\.net)\//i;

/** Logged-out post pages can still be read through the public embed view. */
async function instagramEmbedImages(page: URL): Promise<string[]> {
  const m = page.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return [];
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  try {
    const res = await safeFetch(
      `https://www.instagram.com/${kind}/${m[2]}/embed/captioned/`,
      1_000_000,
      "text/html,*/*",
      8000,
      { "user-agent": CRAWLER_UA }
    );
    const html = res.body.toString("utf8");
    const found = new Set<string>();
    for (const tag of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      const u = decode(tag[1]);
      if (META_CDN.test(u)) found.add(u);
    }
    for (const json of html.matchAll(/"(?:display_url|thumbnail_src)":"([^"]+)"/g)) {
      const u = decode(json[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"));
      if (META_CDN.test(u)) found.add(u);
    }
    return [...found].slice(0, 6);
  } catch {
    return [];
  }
}

function collectFonts(css: string, counts: Map<string, number>) {
  for (const m of css.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    const first = cleanFont(m[1].split(",")[0]);
    if (first) counts.set(first, (counts.get(first) ?? 0) + 1);
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const metaHost = META_HOSTS.test(target.hostname);

  try {
    const page = await safeFetch(
      target.href,
      1_500_000,
      "text/html,*/*",
      8000,
      metaHost ? { "user-agent": CRAWLER_UA } : undefined
    );
    const html = page.body.toString("utf8");
    const base = page.url;
    const abs = (u: string) => {
      try { return new URL(decode(u), base).href; } catch { return ""; }
    };

    const title =
      metaContent(html, "og:title") ||
      metaContent(html, "twitter:title") ||
      decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "") ||
      base.hostname.replace(/^www\./, "");
    const siteName = metaContent(html, "og:site_name") || base.hostname.replace(/^www\./, "");

    const images = new Set<string>();
    for (const k of ["og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"]) {
      const v = metaContent(html, k);
      if (v) images.add(abs(v));
    }
    for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
      if (images.size >= 12) break;
      const src = m[1];
      if (src.startsWith("data:") || /\.svg(\?|$)/i.test(src) || /(sprite|pixel|logo|icon|avatar|1x1)/i.test(src)) continue;
      const u = abs(src);
      if (u) images.add(u);
    }
    if (!images.size && /(?:^|\.)instagram\.com$/i.test(base.hostname)) {
      for (const u of await instagramEmbedImages(base)) images.add(u);
    }

    // Fonts: Google Fonts links, inline <style>, style="" attrs, then up to 3 same-page stylesheets
    const counts = new Map<string, number>();
    for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/gi)) {
      for (const fam of decode(m[1]).matchAll(/family=([^&:]+)/g)) {
        const name = decodeURIComponent(fam[1].replace(/\+/g, " "));
        counts.set(name, (counts.get(name) ?? 0) + 5);
      }
    }
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) collectFonts(m[1], counts);
    for (const m of html.matchAll(/style=["']([^"']*font-family[^"']*)["']/gi)) collectFonts(m[1], counts);
    const sheets = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)]
      .map((t) => t[0].match(/href=["']([^"']+)["']/i)?.[1])
      .filter((h): h is string => !!h && !/fonts\.googleapis/.test(h))
      .map(abs)
      .filter(Boolean)
      .slice(0, 3);
    await Promise.all(
      sheets.map(async (href) => {
        try {
          const css = await safeFetch(href, 800_000, "text/css,*/*", 5000);
          collectFonts(css.body.toString("utf8"), counts);
        } catch { /* ignore individual stylesheet failures */ }
      })
    );
    const fonts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).slice(0, 4);

    return NextResponse.json(
      { url: base.href, title, siteName, images: [...images].filter(Boolean).slice(0, 12), fonts },
      { headers: { "cache-control": "public, max-age=3600" } }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Fetch failed" }, { status: 502 });
  }
}
