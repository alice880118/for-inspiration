"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Inspiration, InspirationDraft } from "@/lib/types";
import { getImage } from "@/lib/db";
import { compressImage, extractPalette, fetchPageMeta, fetchRemoteImage, hostOf, normalizeUrl } from "@/lib/image";

export interface DraftState extends InspirationDraft {
  webImages: string[];
}

const EMPTY: DraftState = {
  title: "",
  sourceUrl: "",
  note: "",
  tags: [],
  keywords: [],
  palette: [],
  fonts: [],
  readingStatus: "none",
  scheduledDate: null,
  completedDate: null,
  imageBlob: null,
  webImages: [],
};

export function useDraft(initial?: Inspiration | null, prefillUrl = "") {
  const [d, setD] = useState<DraftState>(() => ({ ...EMPTY, sourceUrl: prefillUrl }));
  const [fetched, setFetched] = useState(false);
  const [busy, setBusy] = useState<null | "meta" | "image">(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // hydrate from an existing record
  useEffect(() => {
    if (!initial || loadedFor.current === initial.id + initial.updatedAt) return;
    loadedFor.current = initial.id + initial.updatedAt;
    (async () => {
      const blob = initial.imageId ? await getImage(initial.imageId) : null;
      const { id: _i, createdAt: _c, updatedAt: _u, imageId: _im, ...rest } = initial;
      setD({ ...EMPTY, ...rest, imageBlob: blob });
      setFetched(!!initial.sourceUrl);
      setDirty(false);
    })();
  }, [initial]);

  useEffect(() => {
    if (!d.imageBlob) return setPreviewUrl(null);
    const u = URL.createObjectURL(d.imageBlob);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [d.imageBlob]);

  const patch = useCallback((p: Partial<DraftState>) => {
    setD((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }, []);

  const setImage = useCallback(async (blob: Blob, keepPalette = false) => {
    setBusy("image");
    setError(null);
    try {
      const small = await compressImage(blob);
      const palette = keepPalette ? null : await extractPalette(small).catch(() => []);
      setD((prev) => ({ ...prev, imageBlob: small, ...(palette ? { palette } : {}) }));
      setDirty(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, []);

  const useWebImage = useCallback(
    async (url: string) => {
      setBusy("image");
      try {
        const blob = await fetchRemoteImage(url);
        await setImage(blob);
      } catch (e) {
        setError((e as Error).message);
        setBusy(null);
      }
    },
    [setImage]
  );

  /** Paste URL → fetch title / fonts / images → first image → palette. */
  const fetchFromUrl = useCallback(async (override?: string) => {
    const url = normalizeUrl(override ?? d.sourceUrl);
    if (!url) return;
    setBusy("meta");
    setError(null);
    try {
      const meta = await fetchPageMeta(url);
      setD((prev) => ({
        ...prev,
        sourceUrl: override ?? (prev.sourceUrl.trim() || url),
        title: prev.title.trim() ? prev.title : meta.title || hostOf(url),
        fonts: prev.fonts.length ? prev.fonts : meta.fonts,
        webImages: meta.images,
      }));
      setDirty(true);
      setFetched(true);
      setBusy(null);
      if (!d.imageBlob && meta.images[0]) await useWebImage(meta.images[0]);
      return meta;
    } catch (e) {
      // graceful fallback: still use the domain as name
      setD((prev) => ({ ...prev, title: prev.title.trim() ? prev.title : hostOf(url) }));
      setFetched(true);
      setError(`${(e as Error).message} — you can still add an image manually.`);
      setBusy(null);
    }
  }, [d.sourceUrl, d.imageBlob, useWebImage]);

  const reset = useCallback(() => {
    setD({ ...EMPTY });
    setFetched(false);
    setError(null);
    setDirty(false);
  }, []);

  const toDraft = useCallback((): InspirationDraft => {
    const { webImages: _w, ...rest } = d;
    return {
      ...rest,
      title: rest.title.trim(),
      sourceUrl: rest.sourceUrl.trim() ? normalizeUrl(rest.sourceUrl) : "",
      readingStatus: rest.readingStatus === "completed" ? "completed" : rest.scheduledDate ? "scheduled" : "none",
    };
  }, [d]);

  return { d, patch, fetched, setFetched, busy, error, setError, previewUrl, setImage, useWebImage, fetchFromUrl, reset, toDraft, dirty };
}

export type Draft = ReturnType<typeof useDraft>;
