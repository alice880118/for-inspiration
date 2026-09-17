"use client";
import type { Draft } from "./useDraft";
import { NameField, NoteField, PurposeField, TagField, ThumbPicker, UrlField, VisualFields } from "./FormParts";

/** Shared Add / Edit layout (IA §20: edit reuses the add layout). */
export function InspirationForm({
  draft, onCancel, onSave, saveLabel = "Save", saving = false, scheduleOpen, setScheduleOpen, hideCalendar, stickyActions = false,
}: {
  draft: Draft;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saving?: boolean;
  scheduleOpen?: boolean;
  setScheduleOpen?: (v: boolean) => void;
  hideCalendar?: boolean;
  stickyActions?: boolean;
}) {
  const canSave = draft.canSave && !saving;
  const pristine = !draft.dirty;
  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSave();
      }}
    >
      <UrlField draft={draft} />
      {draft.error && <p role="alert" style={{ margin: "-16px 0 0", fontSize: 12, color: "var(--danger)" }}>{draft.error}</p>}

      <div className="group">
        <div className="field-head"><span className="label">Thumbnail</span></div>
        <div className="row-thumb">
          <ThumbPicker draft={draft} />
          <div className="meta-col">
            <NameField draft={draft} />
            <VisualFields draft={draft} />
          </div>
        </div>
      </div>

      <div className="lower">
        <TagField draft={draft} />
        <PurposeField draft={draft} scheduleOpen={scheduleOpen} setScheduleOpen={setScheduleOpen} hideCalendar={hideCalendar} />
        <NoteField draft={draft} />
      </div>

      <div className={`actions${stickyActions ? " detail-actions" : ""}`}>
        <button type="button" className={`btn-m line${pristine ? " quiet" : ""}`} onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-m fill" disabled={!canSave}>{saving ? "Saving…" : saveLabel}</button>
      </div>
    </form>
  );
}
