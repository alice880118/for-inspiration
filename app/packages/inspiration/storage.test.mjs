import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

let storageModule;

async function loadStorageModule() {
  if (storageModule) {
    return storageModule;
  }

  const sourceUrl = new URL("./storage.ts", import.meta.url);
  const source = await readFile(sourceUrl, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      isolatedModules: true,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
  storageModule = await import(moduleUrl);
  return storageModule;
}

test("normalizes legacy records with deterministic ids and safe defaults", async () => {
  const { normalizeCollectionData } = await loadStorageModule();
  const raw = {
    links: [
      { url: "https://example.com/a", title: "Example A" },
      { url: "https://example.com/a", title: "Example A" },
    ],
  };

  const first = normalizeCollectionData(raw);
  const second = normalizeCollectionData(raw);

  assert.ok(first);
  assert.ok(second);
  assert.equal(first.links.length, 2);
  assert.equal(first.links[0].id, second.links[0].id);
  assert.equal(first.links[1].id, second.links[1].id);
  assert.notEqual(first.links[0].id, first.links[1].id);
  assert.deepEqual(first.links[0].cats, ["others"]);
  assert.deepEqual(first.links[0].tags, []);
  assert.equal(first.links[0].thumb, "");
  assert.equal(first.links[0].createdAt, 0);
  assert.equal(first.links[0].needsReview, false);
  assert.equal(first.updatedAt, 0);
});

test("preserves existing link, category, image, and metadata values", async () => {
  const { normalizeCollectionData } = await loadStorageModule();
  const raw = {
    links: [
      {
        id: "existing-id",
        url: "https://example.com",
        title: "Existing",
        cats: ["uiux"],
        tags: ["reference"],
        thumb: "data:image/png;base64,abc",
        createdAt: 123,
        order: 7,
        needsReview: true,
        extra: "kept",
      },
    ],
    cats: [{ id: "uiux", name: "UIUX", color: "#111111", locked: true }],
    updatedAt: 456,
  };

  const normalized = normalizeCollectionData(raw);

  assert.ok(normalized);
  assert.equal(normalized.links[0].id, "existing-id");
  assert.equal(normalized.links[0].thumb, "data:image/png;base64,abc");
  assert.deepEqual(normalized.links[0].tags, ["reference"]);
  assert.equal(normalized.links[0].createdAt, 123);
  assert.equal(normalized.links[0].order, 7);
  assert.equal(normalized.links[0].needsReview, true);
  assert.equal(normalized.links[0].extra, "kept");
  assert.equal(normalized.cats[0].locked, true);
  assert.equal(normalized.updatedAt, 456);
});

test("matches default category fallbacks by id and de-duplicates category ids", async () => {
  const { normalizeCollectionData } = await loadStorageModule();
  const raw = {
    links: [{ url: "https://example.com" }],
    cats: [
      { id: "others", name: "Others" },
      { id: "uiux", name: "UIUX" },
      { id: "others", name: "Others duplicate" },
    ],
  };

  const normalized = normalizeCollectionData(raw);

  assert.ok(normalized);
  assert.equal(normalized.cats[0].id, "others");
  assert.equal(normalized.cats[0].color, "#767676");
  assert.equal(normalized.cats[0].locked, true);
  assert.equal(normalized.cats[1].id, "uiux");
  assert.equal(normalized.cats[1].color, "#6c5ce7");
  assert.equal(normalized.cats[1].locked, undefined);
  assert.equal(normalized.cats[2].id, "others:duplicate-2");
  assert.equal(normalized.cats[2].color, "#767676");
  assert.equal(normalized.cats[2].locked, true);
});

test("normalizes tag color maps without requiring them in legacy data", async () => {
  const { normalizeCollectionData } = await loadStorageModule();
  const legacy = normalizeCollectionData({
    links: [{ url: "https://example.com", tags: ["reference"] }],
    cats: [],
  });
  const withColors = normalizeCollectionData({
    links: [{ url: "https://example.com", tags: ["reference"] }],
    cats: [],
    tagColors: {
      reference: "#ffd6e7",
      ignored: 123,
      unsafe: "not-a-color",
    },
  });

  assert.ok(legacy);
  assert.ok(withColors);
  assert.deepEqual(legacy.tagColors, {});
  assert.deepEqual(withColors.tagColors, { reference: "#ffd6e7" });
});

test("prefers IndexedDB when updatedAt is equal or missing", async () => {
  const { chooseLatestCollection } = await loadStorageModule();
  const indexedDbData = { links: [{ id: "db" }], cats: [], updatedAt: 10 };
  const fallbackData = { links: [{ id: "fallback" }], cats: [], updatedAt: 10 };
  const missingDateIndexedDb = { links: [{ id: "db-missing" }], cats: [] };
  const missingDateFallback = { links: [{ id: "fallback-missing" }], cats: [] };
  const newerFallback = {
    links: [{ id: "newer-fallback" }],
    cats: [],
    updatedAt: 11,
  };

  assert.equal(
    chooseLatestCollection(indexedDbData, fallbackData),
    indexedDbData,
  );
  assert.equal(
    chooseLatestCollection(missingDateIndexedDb, missingDateFallback),
    missingDateIndexedDb,
  );
  assert.equal(
    chooseLatestCollection(indexedDbData, newerFallback),
    newerFallback,
  );
  assert.equal(chooseLatestCollection(indexedDbData, null), indexedDbData);
  assert.equal(chooseLatestCollection(null, fallbackData), fallbackData);
});

test("does not delete the last full localStorage snapshot on quota failure", async () => {
  const { saveCollection } = await loadStorageModule();
  const removedKeys = [];
  const writes = [];
  globalThis.window = {
    localStorage: {
      setItem(key, value) {
        if (key === "inspo:collection:v2") {
          throw new Error("quota exceeded");
        }
        writes.push([key, JSON.parse(value)]);
      },
      removeItem(key) {
        removedKeys.push(key);
      },
    },
  };

  try {
    await saveCollection({
      links: [
        {
          id: "link-1",
          url: "https://example.com",
          title: "Example",
          cats: ["uiux"],
          tags: ["reference"],
          thumb: "data:image/png;base64,abc",
          createdAt: 1,
          order: 1,
          needsReview: false,
        },
      ],
      cats: [],
    });
  } finally {
    delete globalThis.window;
  }

  assert.deepEqual(removedKeys, []);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], "inspo:links:v2");
  assert.equal(writes[0][1].links[0].thumb, "");
});

test("loads the newest valid localStorage fallback key", async () => {
  const { loadCollection } = await loadStorageModule();
  const values = new Map([
    [
      "inspo:collection:v2",
      JSON.stringify({
        links: [{ id: "full", url: "https://full.example" }],
        cats: [],
        updatedAt: 1,
      }),
    ],
    [
      "inspo:links:v2",
      JSON.stringify({
        links: [{ id: "metadata", url: "https://metadata.example" }],
        cats: [],
        updatedAt: 2,
      }),
    ],
    [
      "inspo:cache",
      JSON.stringify({
        links: [{ id: "legacy", url: "https://legacy.example" }],
        cats: [],
      }),
    ],
  ]);
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return values.get(key) ?? null;
      },
      setItem() {},
    },
  };

  try {
    const loaded = await loadCollection();
    assert.equal(loaded.links[0].id, "metadata");
  } finally {
    delete globalThis.window;
  }
});
