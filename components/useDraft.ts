"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Inspiration, InspirationDraft } from "@/lib/types";
import { getImage } from "@/lib/db";
import { compressImage, extractPalette, fetchPageMeta, fetchRemoteImage, hostOf, normalizeUrl } from "@/lib/image";

export interface DraftState extends InspirationDraft {
  webImages: string[];
  imageBlob?: Blob | null;
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
  const [d, setD] = useState<DraftState>(() => ({
    ...EMPTY,
    sourceUrl: prefillUrl,
    imageBlob: initial ? undefined : null,
  }));
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
    setError(null);
    try {
      const small = await compressImage(blob);
      setD((prev) => ({ ...prev, imageBlob: small }));
      setDirty(true);
      if (!keepPalette) {
        extractPalette(small)
          .then((palette) => setD((prev) => ({ ...prev, palette })))
          .catch(() => {});
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const useWebImage = useCallback(
    async (url: string) => {
      try {
        const blob = await fetchRemoteImage(url);
        await setImage(blob);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [setImage]
  );

  /** Paste URL → store the link immediately, then fill title / images in the background. */
  const fetchFromUrl = useCallback(async (override?: string) => {
    const url = normalizeUrl(override ?? d.sourceUrl);
    if (!url) return;
    setError(null);
    setD((prev) => ({
      ...prev,
      sourceUrl: override ?? (prev.sourceUrl.trim() || url),
      title: prev.title.trim() ? prev.title : hostOf(url),
    }));
    setDirty(true);
    setFetched(true);
    setBusy("meta");
    try {
      const meta = await fetchPageMeta(url);
      let needsImage = false;
      setD((prev) => {
        needsImage = !prev.imageBlob && meta.images.length > 0;
        return {
          ...prev,
          sourceUrl: override ?? (prev.sourceUrl.trim() || url),
          title: prev.title.trim() && prev.title !== hostOf(url) ? prev.title : meta.title || hostOf(url),
          fonts: prev.fonts.length ? prev.fonts : meta.fonts,
          webImages: meta.images,
        };
      });
      setBusy(null);
      if (needsImage) void useWebImage(meta.images[0]);
      return meta;
    } catch (e) {
      setError(`${(e as Error).message} — link is saved locally; add an image if you want.`);
      setBusy(null);
    }
  }, [d.sourceUrl, useWebImage]);

  const reset = useCallback(() => {
    setD({ ...EMPTY });
    setFetched(false);
    setError(null);
    setDirty(false);
  }, []);

  const toDraft = useCallback((): InspirationDraft => {
    const { webImages: _w, ...rest } = d;
    const sourceUrl = rest.sourceUrl.trim() ? normalizeUrl(rest.sourceUrl) : "";
    return {
      ...rest,
      title: rest.title.trim() || (sourceUrl ? hostOf(sourceUrl) : ""),
      sourceUrl,
      readingStatus: rest.readingStatus === "completed" ? "completed" : rest.scheduledDate ? "scheduled" : "none",
    };
  }, [d]);

  return { d, patch, fetched, setFetched, busy, error, setError, previewUrl, setImage, useWebImage, fetchFromUrl, reset, toDraft, dirty, canSave: !!(d.title.trim() || d.sourceUrl.trim()) };
}

export type Draft = ReturnType<typeof useDraft>;
