"use client";
/**
 * Local-first storage (IndexedDB).
 *
 * DATA-SAFETY RULES — read before changing anything here:
 * 1. Never delete or rename an object store in `upgrade`. Only ADD stores/indexes.
 * 2. Every schema change = bump DB_VERSION and add a new `if (oldVersion < N)` block.
 *    Old blocks must stay untouched so any old install can migrate step by step.
 * 3. Record-shape changes are handled in `normalizeInspiration` (read-time migration),
 *    so old records keep working without rewriting them.
 * Redeploying on Vercel never touches this data — it lives in the user's browser.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Inspiration, InspirationDraft, Tag } from "./types";

const DB_NAME = "pebbi"; // keep existing IndexedDB name so local libraries stay intact
const DB_VERSION = 1;

interface PebbiDB extends DBSchema {
  inspirations: { key: string; value: Inspiration; indexes: { createdAt: number } };
  images: { key: string; value: { id: string; blob: Blob } };
  tags: { key: string; value: Tag; indexes: { order: number } };
  meta: { key: string; value: unknown };
}

export const DEFAULT_TAGS: Omit<Tag, "id">[] = [
  { name: "UI/UX", displayColor: "#E0E5F0", order: 0 },
  { name: "Graphic", displayColor: "#F7C8CB", order: 1 },
  { name: "Motion", displayColor: "#C2E8C9", order: 2 },
  { name: "Video", displayColor: "#FAE2BF", order: 3 },
  { name: "Web3", displayColor: "#D9C8F0", order: 4 },
  { name: "Others", displayColor: "#C8E9EC", order: 5 },
];

let dbPromise: Promise<IDBPDatabase<PebbiDB>> | null = null;

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function db() {
  if (!dbPromise) {
    dbPromise = openDB<PebbiDB>(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const ins = database.createObjectStore("inspirations", { keyPath: "id" });
          ins.createIndex("createdAt", "createdAt");
          database.createObjectStore("images", { keyPath: "id" });
          const tags = database.createObjectStore("tags", { keyPath: "id" });
          tags.createIndex("order", "order");
          database.createObjectStore("meta");
          for (const t of DEFAULT_TAGS) tx.objectStore("tags").put({ ...t, id: uid() });
        }
        // if (oldVersion < 2) { ...future additive migration... }
      },
    });
    // Ask the browser not to evict our data under storage pressure.
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }
  return dbPromise;
}

function normalizeInspiration(raw: Partial<Inspiration> & { id: string }): Inspiration {
  const now = Date.now();
  return {
    title: "",
    sourceUrl: "",
    imageId: null,
    note: "",
    tags: [],
    keywords: [],
    palette: [],
    fonts: [],
    readingStatus: "none",
    scheduledDate: null,
    completedDate: null,
    createdAt: now,
    updatedAt: now,
    ...raw,
  };
}

/* ---------- meta ---------- */
export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const v = await (await db()).get("meta", key);
  return (v as T) ?? fallback;
}
export async function setMeta(key: string, value: unknown) {
  await (await db()).put("meta", value, key);
}

/**
 * Explicit test reset only — never call from migrations or normal app load.
 * Clears library + meta, reseeds default categories, so Splash goes to Welcome.
 */
export async function resetToOnboarding() {
  const d = await db();
  const tx = d.transaction(["inspirations", "images", "tags", "meta"], "readwrite");
  await tx.objectStore("inspirations").clear();
  await tx.objectStore("images").clear();
  await tx.objectStore("tags").clear();
  await tx.objectStore("meta").clear();
  for (const t of DEFAULT_TAGS) await tx.objectStore("tags").put({ ...t, id: uid() });
  await tx.done;
}

/* ---------- tags ---------- */
export async function listTags(): Promise<Tag[]> {
  const all = await (await db()).getAll("tags");
  return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
export async function createTag(name: string, displayColor: string): Promise<Tag> {
  const d = await db();
  const all = await d.getAll("tags");
  const existing = all.find((t) => t.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;
  const tag: Tag = { id: uid(), name: name.trim(), displayColor, order: all.length };
  await d.put("tags", tag);
  return tag;
}
export async function updateTag(tag: Tag) {
  await (await db()).put("tags", tag);
}
/** Deleting a tag never deletes inspirations — it only detaches the tag. */
export async function deleteTag(id: string) {
  const d = await db();
  const tx = d.transaction(["tags", "inspirations"], "readwrite");
  await tx.objectStore("tags").delete(id);
  let cursor = await tx.objectStore("inspirations").openCursor();
  while (cursor) {
    if (cursor.value.tags.includes(id)) {
      await cursor.update({ ...cursor.value, tags: cursor.value.tags.filter((t) => t !== id) });
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function reorderTags(ids: string[]) {
  const d = await db();
  const tx = d.transaction("tags", "readwrite");
  for (const [order, id] of ids.entries()) {
    const t = await tx.store.get(id);
    if (t) await tx.store.put({ ...t, order });
  }
  await tx.done;
}

/* ---------- keywords (free tags) ---------- */
async function rewriteKeywords(fn: (k: string[]) => string[]) {
  const d = await db();
  const tx = d.transaction("inspirations", "readwrite");
  let cursor = await tx.store.openCursor();
  while (cursor) {
    const cur = normalizeInspiration(cursor.value);
    const next = fn(cur.keywords);
    if (next.join("\u0000") !== cur.keywords.join("\u0000")) await cursor.update({ ...cur, keywords: next });
    cursor = await cursor.continue();
  }
  await tx.done;
}
export async function renameKeyword(from: string, to: string) {
  const name = to.trim();
  await rewriteKeywords((ks) => {
    const out = ks.map((k) => (k === from ? name : k));
    return out.filter((k, i) => out.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i);
  });
}
export async function deleteKeyword(name: string) {
  await rewriteKeywords((ks) => ks.filter((k) => k !== name));
}

/* ---------- inspirations ---------- */
export async function listInspirations(): Promise<Inspiration[]> {
  const all = await (await db()).getAllFromIndex("inspirations", "createdAt");
  return all.map(normalizeInspiration).reverse(); // newest first
}
export async function getInspiration(id: string): Promise<Inspiration | null> {
  const r = await (await db()).get("inspirations", id);
  return r ? normalizeInspiration(r) : null;
}
export async function getImage(id: string): Promise<Blob | null> {
  return (await (await db()).get("images", id))?.blob ?? null;
}

export async function saveInspiration(draft: InspirationDraft, id?: string): Promise<Inspiration> {
  const d = await db();
  const now = Date.now();
  const prev = id ? await d.get("inspirations", id) : undefined;
  const newId = id ?? uid();
  const { imageBlob, ...fields } = draft;
  const rec: Inspiration = normalizeInspiration({
    ...(prev ?? {}),
    ...fields,
    id: newId,
    imageId: imageBlob ? newId : null,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    completedDate: fields.readingStatus === "completed" ? prev?.completedDate ?? now : null,
  });
  const tx = d.transaction(["inspirations", "images"], "readwrite");
  if (imageBlob) await tx.objectStore("images").put({ id: newId, blob: imageBlob });
  else await tx.objectStore("images").delete(newId);
  await tx.objectStore("inspirations").put(rec);
  await tx.done;
  return rec;
}

/** Update record fields only (image untouched) — used by Reading Queue actions. */
export async function patchInspiration(id: string, fields: Partial<Omit<Inspiration, "id" | "imageId">>) {
  const d = await db();
  const prev = await d.get("inspirations", id);
  if (!prev) return null;
  const rec = normalizeInspiration({ ...prev, ...fields, id, updatedAt: Date.now() });
  await d.put("inspirations", rec);
  return rec;
}

export async function deleteInspiration(id: string) {
  const d = await db();
  const tx = d.transaction(["inspirations", "images"], "readwrite");
  await tx.objectStore("inspirations").delete(id);
  await tx.objectStore("images").delete(id);
  await tx.done;
}

/* ---------- backup ---------- */
const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(b);
  });

export async function exportBackup(withImages = true): Promise<Blob> {
  const d = await db();
  const [inspirations, tags, images] = await Promise.all([d.getAll("inspirations"), d.getAll("tags"), withImages ? d.getAll("images") : Promise.resolve([] as { id: string; blob: Blob }[])]);
  const imgs: Record<string, string> = {};
  for (const i of images) imgs[i.id] = await blobToDataUrl(i.blob);
  const payload = { app: "pobbi", schema: DB_VERSION, exportedAt: new Date().toISOString(), tags, inspirations, images: imgs };
  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}

/**
 * Import a backup.
 * merge   — records with the same id are overwritten, nothing else is touched.
 * replace — the library is cleared first (caller must confirm with the user).
 */
export async function importBackup(file: File, mode: "merge" | "replace" = "merge"): Promise<number> {
  const data = JSON.parse(await file.text());
  if ((data?.app !== "pobbi" && data?.app !== "pebbi") || !Array.isArray(data.inspirations)) throw new Error("Not a Pobbi backup file");
  const d = await db();
  const images: [string, Blob][] = [];
  for (const [id, url] of Object.entries<string>(data.images ?? {})) images.push([id, await (await fetch(url)).blob()]);
  const tx = d.transaction(["inspirations", "images", "tags"], "readwrite");
  if (mode === "replace") {
    await tx.objectStore("inspirations").clear();
    await tx.objectStore("images").clear();
    await tx.objectStore("tags").clear();
  }
  for (const t of data.tags ?? []) await tx.objectStore("tags").put(t);
  for (const i of data.inspirations) await tx.objectStore("inspirations").put(normalizeInspiration(i));
  for (const [id, blob] of images) await tx.objectStore("images").put({ id, blob });
  await tx.done;
  return data.inspirations.length;
}
