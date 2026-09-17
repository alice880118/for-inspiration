"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getImage, listInspirations, listTags } from "@/lib/db";
import { dailyCheck } from "@/lib/notify";
import type { Inspiration, Tag } from "@/lib/types";
import { ReminderHost } from "@/app/packages/feedback/ReminderHost";
import { ToastNotification } from "@/app/packages/feedback/ToastNotification";

interface StoreValue {
  ready: boolean;
  inspirations: Inspiration[];
  tags: Tag[];
  tagById: Map<string, Tag>;
  refresh: () => Promise<void>;
  upsertInspiration: (rec: Inspiration, blob?: Blob | null) => void;
  imageUrl: (imageId: string | null) => string | null;
  toast: (msg: string, action?: { label: string; run: () => void }) => void;
  openAdd: (prefillUrl?: string) => void;
  addOpen: boolean;
  addPrefill: string;
  closeAdd: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const urlCache = useRef<Record<string, { url: string; ver: number }>>({});
  const [toastState, setToast] = useState<{ msg: string; action?: { label: string; run: () => void } } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState("");

  const refresh = useCallback(async () => {
    const [ins, tg] = await Promise.all([listInspirations(), listTags()]);
    setInspirations(ins);
    setTags(tg);
    setReady(true);
    const next: Record<string, string> = {};
    await Promise.all(
      ins.map(async (i) => {
        if (!i.imageId) return;
        const cached = urlCache.current[i.imageId];
        if (cached && cached.ver === i.updatedAt) {
          next[i.imageId] = cached.url;
          return;
        }
        const blob = await getImage(i.imageId);
        if (!blob) return;
        if (cached) URL.revokeObjectURL(cached.url);
        const url = URL.createObjectURL(blob);
        urlCache.current[i.imageId] = { url, ver: i.updatedAt };
        next[i.imageId] = url;
      })
    );
    for (const k of Object.keys(urlCache.current)) {
      if (!next[k]) {
        URL.revokeObjectURL(urlCache.current[k].url);
        delete urlCache.current[k];
      }
    }
    setUrls(next);
  }, []);

  const upsertInspiration = useCallback((rec: Inspiration, blob?: Blob | null) => {
    setInspirations((prev) => [rec, ...prev.filter((x) => x.id !== rec.id)]);
    if (rec.imageId && blob) {
      const cached = urlCache.current[rec.imageId];
      if (cached) URL.revokeObjectURL(cached.url);
      const url = URL.createObjectURL(blob);
      urlCache.current[rec.imageId] = { url, ver: rec.updatedAt };
      setUrls((u) => ({ ...u, [rec.imageId!]: url }));
    }
  }, []);

  useEffect(() => {
    refresh().then(async () => {
      const items = await listInspirations();
      dailyCheck(items).catch(() => {});
    });
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      listInspirations().then((items) => dailyCheck(items).catch(() => {}));
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const toast = useCallback((msg: string, action?: { label: string; run: () => void }) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? (action.label === "Organize now" ? 7000 : 4500) : 2400);
  }, []);

  const openAdd = useCallback((url?: string) => {
    setAddPrefill(url ?? "");
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      inspirations,
      tags,
      tagById: new Map(tags.map((t) => [t.id, t])),
      refresh,
      upsertInspiration,
      imageUrl: (id) => (id ? urls[id] ?? null : null),
      toast,
      addOpen,
      addPrefill,
      openAdd,
      closeAdd,
    }),
    [ready, inspirations, tags, refresh, upsertInspiration, urls, toast, addOpen, addPrefill, openAdd, closeAdd]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <ReminderHost inspirations={inspirations} toast={toast} />
      {toastState && (
        <div className="toast">
          <ToastNotification
            message={toastState.msg}
            action={
              toastState.action
                ? {
                    label: toastState.action.label,
                    run: () => {
                      toastState.action!.run();
                      setToast(null);
                    },
                  }
                : undefined
            }
          />
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}
