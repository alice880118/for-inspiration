import { lookup } from "node:dns/promises";
import net from "node:net";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 PobbiBot/0.1";

function isPrivateIp(ip: string) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

async function assertPublic(url: URL) {
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http(s) URLs are allowed");
  const { address } = await lookup(url.hostname);
  if (isPrivateIp(address)) throw new Error("This address is not allowed");
}

/** fetch() that refuses private-network targets (also on every redirect hop) and caps the body size. */
export async function safeFetch(raw: string, maxBytes: number, accept: string, timeoutMs = 8000) {
  let url = new URL(raw);
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": UA, accept },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
    const len = Number(res.headers.get("content-length") || 0);
    if (len > maxBytes) throw new Error("Response too large");
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          reader.cancel().catch(() => {});
          break; // keep what we have (fine for HTML head parsing)
        }
        chunks.push(value);
      }
    }
    const body = Buffer.concat(chunks);
    return { url, body, contentType: res.headers.get("content-type") || "", truncated: total > maxBytes };
  }
  throw new Error("Too many redirects");
}
