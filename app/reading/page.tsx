"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { filterInspirations, sameDay, startOfDay } from "@/lib/filter";
import { effectiveStatus, type Inspiration } from "@/lib/types";
import { useStore } from "@/components/Store";
import { Backdrop, BottomNav, Drawer } from "@/components/ui";
import { FlatItem } from "@/components/FlatItem";
import { SubClose } from "@/components/FormParts";
import { CalendarGrid, CalendarHeader, buildMarks, useCalendarState } from "@/components/Calendar";
import { MarkReadPanel, ReadingHeader, ReadingOptionsPanel, useReadingActions } from "@/components/Reading";
import { IconKebab } from "@/components/Icons";

/** 03-1 Reading Queue (Figma 244:2380) */
export default function ReadingQueue() {
  const router = useRouter();
  const { inspirations, tagById } = useStore();
  const { markRead } = useReadingActions();
  const cal = useCalendarState(Date.now());
  const [day, setDay] = useState(startOfDay(Date.now()));
  const [query, setQuery] = useState("");
  const [marking, setMarking] = useState<Inspiration | null>(null);
  const [options, setOptions] = useState<Inspiration | null>(null);
  const marks = useMemo(() => buildMarks(inspirations), [inspirations]);

  const isToday = sameDay(day, Date.now());
  const pendingOnDay = filterInspirations(
    inspirations.filter((i) => effectiveStatus(i) !== "completed" && i.scheduledDate && sameDay(i.scheduledDate, day)),
    { query, tagById }
  ).sort((a, b) => a.scheduledDate! - b.scheduledDate!);
  const overdue = isToday
    ? filterInspirations(
      inspirations.filter((i) => effectiveStatus(i) === "overdue"),
      { query, tagById }
    ).sort((a, b) => a.scheduledDate! - b.scheduledDate!)
    : [];

  const row = (i: Inspiration) => (
    <FlatItem
      key={i.id}
      item={i}
      size="sm"
      onOpen={() => router.push(`/inspiration?id=${i.id}`)}
      right={
        <>
          {effectiveStatus(i) === "completed" ? (
            <span className="meta"><small>Read</small></span>
          ) : (
            <button className="mark-btn" onClick={() => setMarking(i)}>Mark</button>
          )}
          <button className="kebab" aria-label={`More options for ${i.title}`} onClick={() => setOptions(i)}><IconKebab /></button>
        </>
      }
    />
  );

  const dayLabel = new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <main className="page page-top">
      <Backdrop soft />
      <ReadingHeader title="Reading Queue" active="queue" query={query} onQuery={setQuery} />

      <section style={{ display: "flex", flexDirection: "column", gap: 12, margin: "0 calc(-1 * var(--gutter))" }}>
        <CalendarHeader cal={cal} />
        <div style={{ padding: "0 var(--gutter)" }}>
          <CalendarGrid cal={cal} selected={day} marks={marks} onSelect={(ms) => setDay(startOfDay(ms))} />
        </div>
      </section>

      <section style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="h2">{dayLabel} · {pendingOnDay.length} Pending</h2>
        {pendingOnDay.map(row)}
        {pendingOnDay.length === 0 && (
          <p className="body13 muted" style={{ margin: 0 }}>
            Nothing scheduled for this day. Tick “For Case study” on an inspiration to add it to your queue.
          </p>
        )}
        {overdue.length > 0 && (
          <>
            <h2 className="h2" style={{ marginTop: 12, color: "var(--danger)" }}>Overdue · {overdue.length}</h2>
            {overdue.map(row)}
          </>
        )}
      </section>

      <Drawer open={!!marking} onClose={() => setMarking(null)} label="Mark as read">
        <SubClose>
          {(close) => marking && (
            <MarkReadPanel item={marking} onKeep={close} onRead={async () => { await markRead(marking); close(); }} />
          )}
        </SubClose>
      </Drawer>
      <Drawer open={!!options} onClose={() => setOptions(null)} label="Reading options">
        <SubClose>{(close) => options && <ReadingOptionsPanel item={options} onClose={close} />}</SubClose>
      </Drawer>
      <BottomNav />
    </main>
  );
}
