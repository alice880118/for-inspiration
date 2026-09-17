"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveInspiration, setMeta } from "@/lib/db";
import { Backdrop } from "@/components/ui";
import { useStore } from "@/components/Store";
import { useDraft } from "@/components/useDraft";
import { TagField, ThumbPicker, UrlField } from "@/components/FormParts";
import { AppIcon, IconArrowRight, IconClose } from "@/components/Icons";

/** 00-3 Create First Inspiration — simplified Add flow. */
export default function CreateFirst() {
  const router = useRouter();
  const { refresh, toast } = useStore();
  const draft = useDraft();
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(0);
  const canSave = !!draft.d.title.trim() && !draft.busy && !saving;

  const save = async (another: boolean) => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveInspiration(draft.toDraft());
      await setMeta("hasCompletedOnboarding", true);
      await refresh();
      if (another) {
        draft.reset();
        setCreated((c) => c + 1);
        toast("Saved — add another one");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.replace("/home");
      }
    } catch (e) {
      toast(`Could not save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="onboard-create">
      <Backdrop />
      <header>
        <AppIcon width={46} />
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Let&apos;s get started</h1>
      </header>

      <form noValidate onSubmit={(e) => { e.preventDefault(); save(false); }}>
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
          <button
            type="button"
            className="btn-text"
            onClick={async () => {
              await setMeta("hasCompletedOnboarding", true);
              router.replace("/home");
            }}
          >
            Create Next
          </button>
          {created > 0 && (
            <button type="button" className="btn-link" onClick={() => router.replace("/home")}>
              {created} saved · Go to Home
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
