"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { patchInspiration } from "@/lib/db";
import { sameDay, startOfDay } from "@/lib/filter";
import type { Inspiration, Tag } from "@/lib/types";
import { useStore } from "./Store";
import { Drawer, Palette } from "./ui";
import { SubClose } from "./FormParts";
import { DatePickerPanel, buildMarks } from "./Calendar";
import { FlatItem, statusMeta } from "./FlatItem";
import { IconCalendarAdd, IconClose, IconImage, IconSearch } from "./Icons";

export function ReadingHeader({
  title, active, query, onQuery,
}: {
  title: string;
  active: "queue" | "history";
  query: string;
  onQuery: (q: string) => void;
}) {
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searching) inputRef.current?.focus({ preventScroll: true });
  }, [searching]);

  return (
    <>
      <nav className="page-nav">
        {searching ? (
          <label className="search" style={{ flex: 1, minWidth: 0 }}>
            <IconSearch />
            <span className="sr-only">Search reading</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              placeholder="Search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              enterKeyHint="search"
            />
            <button
              type="button"
              className="clear-btn"
              aria-label="Close search"
              onClick={() => {
                onQuery("");
                setSearching(false);
              }}
            >
              <IconClose />
            </button>
          </label>
        ) : (
          <>
            <h1 className="h1" style={{ fontWeight: 600 }}>{title}</h1>
            <button type="button" className="icon-btn" aria-label="Search" onClick={() => setSearching(true)}>
              <IconSearch />
            </button>
          </>
        )}
      </nav>
      <div className="seg" role="tablist" style={{ margin: "16px 0 24px" }}>
        <Link href="/reading" role="tab" aria-selected={active === "queue"} className={active === "queue" ? "on" : ""} replace>Reading Queue</Link>
        <Link href="/reading/history" role="tab" aria-selected={active === "history"} className={active === "history" ? "on" : ""} replace>Read History</Link>
      </div>
    </>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function mondayOf(ms: number) {
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function weekEndOf(weekStart: number) {
  return weekStart + 7 * 86400000;
}

/** This Week’s Reading — Read History (Figma 230:621), completed items only. */
export function WeekReadingCard({
  items,
  tagById,
  weekStart,
  onPickWeek,
  stamp,
}: {
  items: Inspiration[];
  tagById: Map<string, Tag>;
  weekStart: number;
  onPickWeek: () => void;
  stamp: (i: Inspiration) => number;
}) {
  const weekEnd = weekEndOf(weekStart);
  const mmdd = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
  const perDay = DAYS.map((_, k) => items.filter((i) => Math.floor((startOfDay(stamp(i)) - weekStart) / 86400000) === k).length);
  const max = Math.max(...perDay, 0);
  const tagCounts = new Map<string, number>();
  for (const i of items) for (const t of i.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const legend = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="section-head">
        <h2 className="h2">This Week’s Reading</h2>
        <button className="range-pill" onClick={onPickWeek} aria-label="Change week">
          {mmdd(weekStart)} - {mmdd(weekEnd - 1)} <IconCalendarAdd size={20} />
        </button>
      </div>
      <div className="week-card" aria-label={`Per day: ${DAYS.map((d, k) => `${d} ${perDay[k]}`).join(", ")}`}>
        <div className="bars" aria-hidden>
          {perDay.map((n, k) => (
            <i key={k} className={n && n === max ? "max" : n >= max / 2 && n ? "mid" : ""} style={{ height: `${max ? Math.max(12, (n / max) * 100) : 12}%` }} title={`${DAYS[k]}: ${n}`} />
          ))}
        </div>
        <div className="bar-labels" aria-hidden>{DAYS.map((d) => <span key={d}>{d}</span>)}</div>
        {legend.length > 0 ? (
          <div className="legend">
            {legend.map(([t, n]) => <span key={t}>{tagById.get(t)?.name ?? "—"}<b>{n}</b></span>)}
          </div>
        ) : (
          <div className="legend" style={{ color: "var(--muted)" }}>No readings this week yet</div>
        )}
      </div>
    </section>
  );
}

export function useReadingActions() {
  const { refresh, toast } = useStore();
  const markRead = async (i: Inspiration) => {
    await patchInspiration(i.id, { readingStatus: "completed", completedDate: Date.now() });
    await refresh();
    toast("Marked as read", {
      label: "Undo",
      run: async () => {
        await patchInspiration(i.id, { readingStatus: i.scheduledDate ? "scheduled" : "none", completedDate: null });
        await refresh();
      },
    });
  };
  const reschedule = async (i: Inspiration, ms: number | null) => {
    await patchInspiration(i.id, ms ? { scheduledDate: ms, readingStatus: "scheduled", completedDate: null } : { scheduledDate: null, readingStatus: "none", completedDate: null });
    await refresh();
    toast(ms ? `Rescheduled to ${new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Removed from Reading Queue");
  };
  return { markRead, reschedule };
}

/** Figma "Article Read Drawer" (244:2126) */
export function MarkReadPanel({ item, onKeep, onRead }: { item: Inspiration; onKeep: () => void; onRead: () => void }) {
  const { imageUrl, tagById } = useStore();
  const src = imageUrl(item.imageId);
  const labels = item.tags.map((t) => tagById.get(t)?.name).filter(Boolean) as string[];
  const when = item.scheduledDate
    ? sameDay(item.scheduledDate, Date.now())
      ? "Today"
      : new Date(item.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  const meta = statusMeta(item);
  return (
    <div className="drawer-body">
      <h2 className="drawer-title" style={{ fontSize: 18 }}>Mark as read?</h2>
      <div className="read-card">
        <div className="top">
          <span className="pill-blue">{labels[0] ?? "Article"}</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{when}</span>
        </div>
        <div className="inner flat">
          <span className="thumb-sq">{src ? <img src={src} alt="" /> : <IconImage size={24} />}</span>
          <span className="body" style={{ gap: 10 }}>
            <span className="title" style={{ fontSize: 14 }}>{item.title}</span>
            <span className="sub">
              {item.palette.length > 0 && <Palette colors={item.palette.slice(0, 5)} size="s" />}
              <span className="kw">{labels.slice(0, 3).map((l) => <span key={l}>{l}</span>)}</span>
            </span>
          </span>
          <span className="meta"><b>{meta.time}</b><small>{meta.label}</small></span>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-m soft" onClick={onKeep}>Keep</button>
        <button type="button" className="btn-m fill" onClick={onRead}>Read</button>
      </div>
    </div>
  );
}

/** Drawer_Reading_Options (IA §11) — styled like the other drawers */
export function ReadingOptionsPanel({
  item, onClose,
}: { item: Inspiration; onClose: () => void }) {
  const router = useRouter();
  const { inspirations } = useStore();
  const { reschedule } = useReadingActions();
  const [dateOpen, setDateOpen] = useState(false);
  return (
    <div className="drawer-body">
      <h2 className="drawer-title">{item.title}</h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <button className="set-row" onClick={() => { onClose(); router.push(`/inspiration?id=${item.id}`); }}>Open inspiration</button>
        {item.sourceUrl && (
          <a className="set-row" href={item.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}>Open original link</a>
        )}
        <button className="set-row" onClick={() => setDateOpen(true)}>Reschedule</button>
        <button className="set-row" style={{ color: "var(--danger)" }} onClick={async () => { await reschedule(item, null); onClose(); }}>Remove from Reading Queue</button>
      </div>
      <Drawer open={dateOpen} onClose={() => setDateOpen(false)} label="Date Picker" sub>
        <SubClose>
          {(close) => (
            <DatePickerPanel
              value={item.scheduledDate}
              marks={buildMarks(inspirations)}
              onCancel={close}
              onSave={async (ms) => { await reschedule(item, ms); close(); onClose(); }}
            />
          )}
        </SubClose>
      </Drawer>
    </div>
  );
}
