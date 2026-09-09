export type InspirationLink = {
  id: string;
  url: string;
  title: string;
  cats: string[];
  tags: string[];
  thumb: string;
  createdAt: number;
  order: number;
  needsReview: boolean;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  locked?: boolean;
};

export type CollectionData = {
  links: InspirationLink[];
  cats: Category[];
  tagColors?: Record<string, string>;
  updatedAt?: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "uiux", name: "UIUX", color: "#6c5ce7" },
  { id: "graphic", name: "Graphic", color: "#e17055" },
  { id: "motion", name: "Motion", color: "#00a884" },
  { id: "video", name: "Video", color: "#d65b83" },
  { id: "web3", name: "Web3", color: "#3877c9" },
  { id: "others", name: "Others", color: "#767676", locked: true },
];

const DATABASE_NAME = "inspiration-collector";
const DATABASE_VERSION = 1;
const STORE_NAME = "collection";
const SNAPSHOT_KEY = "current";
const LEGACY_KEY = "inspo:cache";
const FALLBACK_KEY = "inspo:collection:v2";
const METADATA_FALLBACK_KEY = "inspo:links:v2";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object";
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const strings = value.filter(
    (item): item is string => typeof item === "string",
  );
  return strings.length > 0 ? strings : [...fallback];
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function normalizeTagColors(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && isHexColor(entry[1]),
    ),
  );
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function uniqueId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  let candidate = `${baseId}:duplicate-${suffix}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}:duplicate-${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function emptyCollection(): CollectionData {
  return {
    links: [],
    cats: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    tagColors: {},
  };
}

function normalizeCategory(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): Category {
  const record = isRecord(value) ? value : {};
  const positionFallback =
    DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length] ??
    DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
  const name = stringValue(record.name, "Untitled");
  const rawId = stringValue(record.id).trim();
  const matchedDefault = DEFAULT_CATEGORIES.find(
    (category) => category.id === rawId,
  );
  const fallbackId = `category:${stableHash(
    `${name}|${index.toString()}`,
  )}`;

  return {
    ...record,
    id: uniqueId(rawId || fallbackId, usedIds),
    name,
    color: stringValue(
      record.color,
      matchedDefault?.color ?? positionFallback.color,
    ),
    locked:
      typeof record.locked === "boolean"
        ? record.locked
        : matchedDefault?.locked,
  } as Category;
}

function normalizeLink(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): InspirationLink {
  const record = isRecord(value) ? value : {};
  const url = stringValue(record.url);
  const title = stringValue(record.title, url || "Untitled");
  const createdAt = numberValue(record.createdAt, 0);
  const rawId = stringValue(record.id).trim();
  const fallbackId = `legacy:${stableHash(
    `${url}|${createdAt.toString()}|${title}|${index.toString()}`,
  )}`;

  return {
    ...record,
    id: uniqueId(rawId || fallbackId, usedIds),
    url,
    title,
    cats: stringArray(record.cats, ["others"]),
    tags: stringArray(record.tags, []),
    thumb: stringValue(record.thumb),
    createdAt,
    order: numberValue(record.order, createdAt || index),
    needsReview:
      typeof record.needsReview === "boolean"
        ? record.needsReview
        : false,
  } as InspirationLink;
}

export function normalizeCollectionData(
  value: unknown,
): CollectionData | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidate = value as Partial<CollectionData>;
  if (!Array.isArray(candidate.links)) {
    return null;
  }

  const usedIds = new Set<string>();
  const usedCategoryIds = new Set<string>();
  return {
    ...candidate,
    links: candidate.links.map((link, index) =>
      normalizeLink(link, index, usedIds),
    ),
    cats:
      Array.isArray(candidate.cats) && candidate.cats.length > 0
        ? candidate.cats.map((category, index) =>
            normalizeCategory(category, index, usedCategoryIds),
          )
        : emptyCollection().cats,
    tagColors: normalizeTagColors(candidate.tagColors),
    updatedAt: numberValue(candidate.updatedAt, 0),
  };
}

export function chooseLatestCollection(
  indexedDbData: CollectionData | null,
  fallbackData: CollectionData | null,
): CollectionData | null {
  if (!indexedDbData) {
    return fallbackData;
  }
  if (!fallbackData) {
    return indexedDbData;
  }

  return (fallbackData.updatedAt ?? 0) > (indexedDbData.updatedAt ?? 0)
    ? fallbackData
    : indexedDbData;
}

function readLocalStorage(): CollectionData | null {
  let fallback: CollectionData | null = null;

  for (const key of [FALLBACK_KEY, METADATA_FALLBACK_KEY, LEGACY_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      const data = raw ? normalizeCollectionData(JSON.parse(raw)) : null;
      if (data) {
        fallback = chooseLatestCollection(fallback, data);
      }
    } catch {
      // Continue to the next source when stored data is malformed.
    }
  }
  return fallback;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIndexedDb(): Promise<CollectionData | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(SNAPSHOT_KEY);

    request.onsuccess = () => resolve(normalizeCollectionData(request.result));
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writeIndexedDb(data: CollectionData): Promise<void> {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(data, SNAPSHOT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

  database.close();
}

function mirrorToLocalStorage(data: CollectionData): void {
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
  } catch {
    // Keep the last full snapshot intact and fall back to lightweight metadata.
  }

  try {
    const metadataOnly = {
      ...data,
      links: data.links.map((link) => ({ ...link, thumb: "" })),
    };
    window.localStorage.setItem(
      METADATA_FALLBACK_KEY,
      JSON.stringify(metadataOnly),
    );
  } catch {
    // IndexedDB remains the primary store on extremely constrained browsers.
  }
}

export async function loadCollection(): Promise<CollectionData> {
  const fallback = readLocalStorage();

  if (!("indexedDB" in window)) {
    return fallback ?? emptyCollection();
  }

  try {
    const stored = await readIndexedDb();
    if (stored || fallback) {
      const latest = chooseLatestCollection(stored, fallback)!;
      mirrorToLocalStorage(latest);
      if (latest === fallback) {
        await writeIndexedDb(latest);
      }
      return latest;
    }

    const initial = fallback ?? emptyCollection();
    await writeIndexedDb(initial);
    mirrorToLocalStorage(initial);
    return initial;
  } catch {
    return fallback ?? emptyCollection();
  }
}

let writeQueue: Promise<void> = Promise.resolve();

export async function saveCollection(data: CollectionData): Promise<void> {
  const stored = { ...data, updatedAt: Date.now() };
  mirrorToLocalStorage(stored);

  if (!("indexedDB" in window)) {
    return;
  }

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => writeIndexedDb(stored));
  await writeQueue;
}
