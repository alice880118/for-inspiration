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

function emptyCollection(): CollectionData {
  return {
    links: [],
    cats: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
  };
}

function normalize(value: unknown): CollectionData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<CollectionData>;
  if (!Array.isArray(candidate.links)) {
    return null;
  }

  return {
    links: candidate.links,
    cats:
      Array.isArray(candidate.cats) && candidate.cats.length > 0
        ? candidate.cats
        : emptyCollection().cats,
    updatedAt:
      typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
  };
}

function readLocalStorage(): CollectionData | null {
  for (const key of [FALLBACK_KEY, METADATA_FALLBACK_KEY, LEGACY_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      const data = raw ? normalize(JSON.parse(raw)) : null;
      if (data) {
        return data;
      }
    } catch {
      // Continue to the next source when stored data is malformed.
    }
  }
  return null;
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

    request.onsuccess = () => resolve(normalize(request.result));
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
    // Keep room for a lightweight link-only fallback when thumbnails are large.
    window.localStorage.removeItem(FALLBACK_KEY);
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
      const latest =
        (fallback?.updatedAt ?? 0) > (stored?.updatedAt ?? 0)
          ? fallback!
          : stored!;
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
