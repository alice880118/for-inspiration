"use client";
import { AlertTriangle } from "./AlertTriangle";

/** Figma Toast Notification 285:1693 */
export function ToastNotification({
  message,
  action,
}: {
  message: string;
  action?: { label: string; run: () => void };
}) {
  return (
    <div className="fb-toast" role="status">
      {action?.label === "Organize now" && (
        <span className="fb-icon"><AlertTriangle width={16} height={14} /></span>
      )}
      <div className="fb-copy">
        <p>{message}</p>
        {action && (
          <button type="button" className="fb-cta" onClick={action.run}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
