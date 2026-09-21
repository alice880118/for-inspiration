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
    <main className="page page-top detail-page">
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
            stickyActions
            actionTopLeft={
              <button type="button" className="btn-link detail-delete" onClick={() => setConfirmDel(true)}>Delete</button>
            }
            actionTopRight={
              rec && (
                <span className="muted">
                  Added {new Date(rec.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                  {status === "overdue" && <b style={{ color: "var(--danger)" }}> · Overdue</b>}
                </span>
              )
            }
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

          {(status === "scheduled" || status === "overdue") && (
            <div className="detail-meta">
              <button className="btn-link" style={{ color: "var(--black)" }} onClick={() => draft.patch({ readingStatus: "completed" })}>Mark as Read</button>
            </div>
          )}
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
