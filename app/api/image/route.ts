import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "@/lib/safe-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same-origin image proxy so the client can read pixels (palette) and store the blob. */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  try {
    // Meta's CDNs drop image requests that arrive without a matching referer.
    const metaCdn = /(?:cdninstagram\.com|fbcdn\.net)$/i.test(new URL(raw).hostname);
    const res = await safeFetch(
      raw,
      8_000_000,
      "image/avif,image/webp,image/png,image/jpeg,image/*",
      8000,
      metaCdn ? { referer: "https://www.instagram.com/" } : undefined
    );
    if (res.truncated) throw new Error("Image too large");
    const type = res.contentType.split(";")[0].trim();
    if (!type.startsWith("image/")) throw new Error("Not an image");
    return new NextResponse(new Uint8Array(res.body), {
      headers: { "content-type": type, "cache-control": "public, max-age=86400" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
