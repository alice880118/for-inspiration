"use client";
import { useMemo, useState } from "react";
import type { Inspiration } from "@/lib/types";
import { IconChevron } from "./Icons";

export const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DayMarks = Map<string, { pending: number; read: number }>;

/** pending dots = scheduled & unread; blue bold = has something read that day */
export function buildMarks(items: Inspiration[]): DayMarks {
  const m: DayMarks = new Map();
  for (const i of items) {
    if (i.readingStatus === "completed" && i.completedDate) {
      const k = dayKey(i.completedDate);
      const e = m.get(k) ?? { pending: 0, read: 0 };
      e.read++;
      m.set(k, e);
    } else if (i.scheduledDate) {
      const k = dayKey(i.scheduledDate);
      const e = m.get(k) ?? { pending: 0, read: 0 };
      e.pending++;
      m.set(k, e);
    }
  }
  return m;
}

export function useCalendarState(initial: number | null) {
  const base = new Date(initial ?? Date.now());
  const [cursor, setCursor] = useState(new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime());
  const [view, setView] = useState<"month" | "week">("month");
  const shift = (dir: 1 | -1) => {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + dir, 1);
    else d.setDate(d.getDate() + 7 * dir);
    setCursor(d.getTime());
  };
  return { cursor, setCursor, view, setView, shift };
}

export function CalendarHeader({ cal }: { cal: ReturnType<typeof useCalendarState> }) {
  const d = new Date(cal.cursor);
  return (
    <div className="cal-head">
      <span className="h2">{d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
      <div className="cal-ctrl">
        <button type="button" aria-label={`Previous ${cal.view}`} onClick={() => cal.shift(-1)}><IconChevron size={16} dir="left" /></button>
        <button type="button" aria-label={`Next ${cal.view}`} onClick={() => cal.shift(1)}><IconChevron size={16} /></button>
        <span className="cal-view" role="group" aria-label="Calendar view">
          <button type="button" aria-pressed={cal.view === "month"} onClick={() => cal.setView("month")}>Month</button>
          {" / "}
          <button type="button" aria-pressed={cal.view === "week"} onClick={() => cal.setView("week")}>Week</button>
        </span>
      </div>
    </div>
  );
}

export function CalendarGrid({
  cal, selected, marks, onSelect,
}: {
  cal: ReturnType<typeof useCalendarState>;
  selected: number | null;
  marks?: DayMarks;
  onSelect: (ms: number) => void;
}) {
  const cells = useMemo(() => {
    const c = new Date(cal.cursor);
    if (cal.view === "week") {
      const start = new Date(c.getFullYear(), c.getMonth(), c.getDate() - c.getDay());
      return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    const first = new Date(c.getFullYear(), c.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const last = new Date(c.getFullYear(), c.getMonth() + 1, 0);
    const total = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [cal.cursor, cal.view]);

  const month = new Date(cal.cursor).getMonth();
  const todayKey = dayKey(Date.now());
  const selKey = selected != null ? dayKey(selected) : null;
  const todayDow = new Date().getDay();

  return (
    <div className="cal-card">
      <div className="cal-row cal-dow">
        {DOW.map((d, i) => <span key={d} style={i === todayDow ? { color: "#000" } : undefined}>{d}</span>)}
      </div>
      <div className="cal-grid" role="grid">
        {cells.map((d) => {
          const k = dayKey(d.getTime());
          const out = cal.view === "month" && d.getMonth() !== month;
          const m = marks?.get(k);
          const isSel = k === selKey;
          const isToday = k === todayKey;
          const cls = ["cal-day", out && "out", m?.read && "read", isToday && "today", isSel && "sel"].filter(Boolean).join(" ");
          return (
            <button
              key={k}
              type="button"
              role="gridcell"
              className={cls}
              aria-selected={isSel}
              aria-label={`${d.toDateString()}${m?.pending ? `, ${m.pending} pending` : ""}${m?.read ? `, ${m.read} read` : ""}`}
              onClick={() => onSelect(d.getTime())}
            >
              <span className="n">{d.getDate()}</span>
              {!!m?.pending && !isSel && (
                <span className="dots" aria-hidden>
                  {Array.from({ length: Math.min(3, m.pending) }, (_, i) => <i key={i} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Figma "Date Picker" (276:2248) — used for scheduling a Case study. */
export function DatePickerPanel({
  value, marks, onSave, onCancel, title = "Date Picker", allowClear = false, withTime = true,
}: {
  value: number | null;
  marks?: DayMarks;
  onSave: (ms: number | null) => void;
  onCancel: () => void;
  title?: string;
  allowClear?: boolean;
  withTime?: boolean;
}) {
  const init = value ?? defaultSlot();
  const cal = useCalendarState(init);
  const [day, setDay] = useState<number>(init);
  const [time, setTime] = useState(() => {
    const d = new Date(init);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const combine = () => {
    const d = new Date(day);
    const [h, m] = time.split(":").map(Number);
    d.setHours(withTime ? h || 0 : 0, withTime ? m || 0 : 0, 0, 0);
    return d.getTime();
  };
  return (
    <div className="drawer-body">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="drawer-title">{title}</h2>
        {allowClear && value != null && (
          <button type="button" className="btn-link" onClick={() => onSave(null)}>Clear</button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <CalendarHeader cal={cal} />
        <CalendarGrid cal={cal} selected={day} marks={marks} onSelect={setDay} />
        {withTime && (
          <label className="time-row">
            <span className="label">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        )}
      </div>
      <div className="form-actions">
        <button type="button" className="btn-m line" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-m fill" onClick={() => onSave(combine())}>Save</button>
      </div>
    </div>
  );
}

export function defaultSlot() {
  const dt = new Date();
  dt.setHours(20, 0, 0, 0);
  if (dt.getTime() < Date.now()) dt.setDate(dt.getDate() + 1);
  return dt.getTime();
}
