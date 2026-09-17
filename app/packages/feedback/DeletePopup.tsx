"use client";
import { createPortal } from "react-dom";
import { AlertTriangle } from "./AlertTriangle";

/** Figma Delete_popup 285:1676 */
export function DeletePopup({
  name,
  count,
  onCancel,
  onConfirm,
}: {
  name: string;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fb-delete-scrim" role="alertdialog" aria-modal="true" aria-label={`Delete “${name}” category?`} onClick={onCancel}>
      <div className="fb-popup" onClick={(e) => e.stopPropagation()}>
        <h3>Delete “{name}” category?</h3>
        <div className="fb-warn">
          <span className="fb-icon"><AlertTriangle width={18} height={16} /></span>
          <p>
            {count} card{count === 1 ? "" : "s"} use this category. The cards won’t be deleted.
          </p>
        </div>
        <div className="fb-actions">
          <button type="button" className="line" onClick={onCancel}>Cancel</button>
          <button type="button" className="fill" onClick={onConfirm}>Delete category</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
