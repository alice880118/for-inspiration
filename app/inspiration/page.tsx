"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { deleteInspiration, getInspiration, saveInspiration } from "@/lib/db";
import type { Inspiration } from "@/lib/types";
import { effectiveStatus } from "@/lib/types";
import { useStore } from "@/components/Store";
import { useDraft } from "@/components/useDraft";
import { InspirationForm } from "@/components/InspirationForm";
import { Backdrop, ConfirmModal } from "@/components/ui";
import { IconBack, IconCalendarAdd } from "@/components/Icons";

export default function DetailPage() {
  return (
    <Suspense>
      <Detail />
    </Suspense>
  );
}

/** 04 Inspiration Detail (editable, per 01_Home_Inspiration_detail) */
function useRecordId() {
  const fromParams = useSearchParams().get("id") ?? "";
  if (fromParams) return fromParams;
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("id") ?? "";
}

function Detail() {
  const router = useRouter();
  const id = useRecordId();
  const { refresh, toast, inspirations, upsertInspiration } = useStore();
  const [rec, setRec] = useState<Inspiration | null | undefined>(() =>
    id ? inspirations.find((i) => i.id === id) ?? undefined : undefined
  );
  const draft = useDraft(rec ?? null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const hit = inspirations.find((i) => i.id === id);
    if (hit) setRec(hit);
    let cancelled = false;
    getInspiration(id).then((row) => {
      if (cancelled) return;
      if (row) setRec(row);
      else if (!hit) setRec(null);
    });
    return () => {
      cancelled = true;
    };
  }, [id, inspirations]);

  const back = () => (window.history.length > 1 ? router.back() : router.replace("/home"));

  if (rec === null) {
    return (
      <main className="center-stack">
        <Backdrop soft />
        <div className="empty">
          <p className="h1">Inspiration not found</p>
          <button className="btn-pill" onClick={() => router.replace("/home")}>Back to Home</button>
        </div>
      </main>
    );
  }

  const status = rec ? effectiveStatus({ ...rec, ...draft.toDraft() } as Inspiration) : "none";

  return (
    <main className="page page-top">
      <Backdrop soft />
      <nav className="page-nav" style={{ marginBottom: 24 }}>
        <div className="left">
          <button className="back-btn" aria-label="Back" onClick={back}><IconBack /></button>
          <h1 className="h1" style={{ fontWeight: 600 }}>Inspiration Detail</h1>
        </div>
        <button className="icon-btn" aria-label="Schedule reading" onClick={() => setScheduleOpen(true)}>
          <IconCalendarAdd />
        </button>
      </nav>

      {rec === undefined && (
        <div style={{ minHeight: 240 }} aria-busy="true" />
      )}

      {rec && (
        <>
          <InspirationForm
            draft={draft}
            saving={saving}
            scheduleOpen={scheduleOpen}
            setScheduleOpen={setScheduleOpen}
            hideCalendar
            onCancel={back}
            onSave={async () => {
              setSaving(true);
              try {
                const payload = draft.toDraft();
                const next = await saveInspiration(payload, rec.id);
                upsertInspiration(next, payload.imageBlob);
                toast("Changes saved");
                back();
                void refresh();
              } finally {
                setSaving(false);
              }
            }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginTop: 20, fontSize: 12 }}>
            <span className="muted">
              Added {new Date(rec.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              {status === "overdue" && <b style={{ color: "var(--danger)" }}> · Overdue</b>}
            </span>
            <span style={{ display: "flex", gap: 16 }}>
              {(status === "scheduled" || status === "overdue") && (
                <button className="btn-link" style={{ color: "var(--black)" }} onClick={() => draft.patch({ readingStatus: "completed" })}>Mark as Read</button>
              )}
              {draft.d.sourceUrl && (
                <button className="btn-link" onClick={async () => {
                  await navigator.clipboard?.writeText(draft.d.sourceUrl).catch(() => {});
                  toast("Link copied");
                }}>Copy Link</button>
              )}
              <button className="btn-link" style={{ color: "var(--danger)" }} onClick={() => setConfirmDel(true)}>Delete</button>
            </span>
          </div>
        </>
      )}

      {confirmDel && rec && (
        <ConfirmModal
          title="Delete Inspiration?"
          body="This inspiration will be permanently removed."
          confirm="Delete"
          onCancel={() => setConfirmDel(false)}
          onConfirm={async () => {
            await deleteInspiration(rec.id);
            await refresh();
            toast("Inspiration deleted");
            router.replace("/home");
          }}
        />
      )}
    </main>
  );
}
