"use client";

/** Figma reminder_popup 285:1661 */
export function ReminderPopup({
  count,
  onSnooze,
  onReadNow,
  onEditSchedule,
}: {
  count: number;
  onSnooze: () => void;
  onReadNow: () => void;
  onEditSchedule: () => void;
}) {
  const noun = count === 1 ? "Case Study" : "Case Studies";
  return (
    <div className="fb-popup" role="dialog" aria-label="Today’s Case Study reminder">
      <h3>Today’s Case Study reminder</h3>
      <p className="fb-body">
        You still have {count} {noun} scheduled for today that haven’t been read.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center" }}>
        <div className="fb-actions">
          <button type="button" className="line" onClick={onSnooze}>Remind in 10 m</button>
          <button type="button" className="fill" onClick={onReadNow}>Read now</button>
        </div>
        <button type="button" className="fb-edit" onClick={onEditSchedule}>Edit schedule</button>
      </div>
    </div>
  );
}
