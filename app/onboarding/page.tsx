"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveInspiration, setMeta } from "@/lib/db";
import { enrichInspirationFromUrl } from "@/lib/image";
import { Backdrop } from "@/components/ui";
import { useStore } from "@/components/Store";
import { useDraft } from "@/components/useDraft";
import { TagField, ThumbPicker, UrlField } from "@/components/FormParts";
import { AppIcon, IconArrowRight, IconClose } from "@/components/Icons";

/** 00-3 Create First Inspiration — simplified Add flow. */
export default function CreateFirst() {
  const router = useRouter();
  const { toast, upsertInspiration } = useStore();
  const draft = useDraft();
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const canSave = draft.canSave && !saving;

  useEffect(() => {
    router.prefetch("/home");
  }, [router]);

  const goHome = () => {
    if (leaving) return;
    setLeaving(true);
    void setMeta("hasCompletedOnboarding", true);
    window.setTimeout(() => router.replace("/home"), 260);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = draft.toDraft();
      const rec = await saveInspiration(payload);
      upsertInspiration(rec, payload.imageBlob ?? null);
      if (rec.sourceUrl) {
        void enrichInspirationFromUrl(rec.id, rec.sourceUrl).then((extra) => {
          if (extra?.rec) upsertInspiration(extra.rec, extra.blob);
        });
      }
      goHome();
    } catch (e) {
      toast(`Could not save: ${(e as Error).message}`);
      setSaving(false);
    }
  };

  return (
    <main className={`onboard-create onboarding-transition${leaving ? " is-leaving" : ""}`}>
      <Backdrop />
      <header>
        <AppIcon width={46} />
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Let&apos;s get started</h1>
      </header>

      <form noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="onboard-fields">
          <ThumbPicker draft={draft} />

          <UrlField draft={draft} glass label="Website URL" placeholder="Paste or type a URL..." />
          {draft.error && <p role="alert" style={{ margin: "-8px 0 0", fontSize: 12, color: "var(--danger)", alignSelf: "flex-start" }}>{draft.error}</p>}

          <div style={{ width: "100%" }}>
            <TagField draft={draft} />
          </div>

          <div className="field">
            <span className="label" style={{ fontSize: 12 }}>Inspiration Name</span>
            <label className="input glass">
              <span className="sr-only">Inspiration Name</span>
              <input placeholder="e.g. Portfolio reference..." value={draft.d.title} maxLength={80} onChange={(e) => draft.patch({ title: e.target.value })} />
              {draft.d.title && (
                <button type="button" className="clear-btn" aria-label="Clear name" onClick={() => draft.patch({ title: "" })}>
                  <IconClose size={16} />
                </button>
              )}
            </label>
          </div>
        </div>

        <div className="onboard-cta">
          <button type="submit" className="btn-primary" disabled={!canSave}>
            {saving ? "Saving…" : "Create Inspiration"} <IconArrowRight />
          </button>
          <button type="button" className="btn-text" onClick={goHome}>
            Create Next
          </button>
        </div>
      </form>
    </main>
  );
}
