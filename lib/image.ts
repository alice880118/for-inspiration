"use client";

function loadBitmap(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      res(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("Image could not be decoded"));
    };
    img.src = url;
  });
}

/** Downscale + re-encode on the way in, so IndexedDB stays small. */
export async function compressImage(blob: Blob, maxSide = 1280, quality = 0.85): Promise<Blob> {
  if (blob.type === "image/gif" || blob.type === "image/svg+xml") return blob;
  const img = await loadBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  if (!out || out.size >= blob.size) return blob;
  return out;
}

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

export function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace("#", "").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colorDistance(a: string, b: string) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const rm = (r1 + r2) / 2;
  // "redmean" weighted distance — cheap and closer to perception than plain RGB
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}

/** Top-N dominant colors: 5-bit bucket histogram, then pick distinct buckets by population. */
export async function extractPalette(blob: Blob, count = 5): Promise<string[]> {
  const img = await loadBitmap(blob);
  const size = 72;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    buckets.set(key, e);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => hex(e.r / e.n, e.g / e.n, e.b / e.n));
  const picked: string[] = [];
  for (const minDist of [120, 80, 40, 0]) {
    for (const c of sorted) {
      if (picked.length >= count) break;
      if (picked.every((p) => colorDistance(p, c) > minDist)) picked.push(c);
    }
    if (picked.length >= count) break;
  }
  return picked;
}

export interface PageMeta {
  url: string;
  title: string;
  siteName: string;
  images: string[];
  fonts: string[];
}

export async function fetchPageMeta(url: string): Promise<PageMeta> {
  const res = await fetch(`/api/meta?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Could not read this page");
  return data;
}

export async function fetchRemoteImage(url: string): Promise<Blob> {
  const res = await fetch(`/api/image?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("Could not download image");
  return res.blob();
}

export function normalizeUrl(input: string): string {
  const s = input.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export function hostOf(url: string) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
