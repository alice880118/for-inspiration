"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { filterInspirations, startOfDay } from "@/lib/filter";
import { useStore } from "@/components/Store";
import { Backdrop, BottomNav, Drawer } from "@/components/ui";
import { FlatItem } from "@/components/FlatItem";
import { SubClose } from "@/components/FormParts";
import { DatePickerPanel, buildMarks } from "@/components/Calendar";
import { ReadingHeader, WeekReadingCard, mondayOf, weekEndOf } from "@/components/Reading";
import { InertialY } from "@/components/InertialScroll";

/** 03-2 Read History (Figma 230:621) — completed items only. */
export default function ReadHistory() {
  const router = useRouter();
  const { inspirations, tagById } = useStore();
  const [weekStart, setWeekStart] = useState(mondayOf(Date.now()));
  const [pick, setPick] = useState(false);
  const [query, setQuery] = useState("");
  const weekEnd = weekEndOf(weekStart);

  const read = useMemo(
    () => filterInspirations(
      inspirations.filter((i) => i.readingStatus === "completed" && i.completedDate != null && i.completedDate >= weekStart && i.completedDate < weekEnd),
      { query, tagById }
    ).sort((a, b) => b.completedDate! - a.completedDate!),
    [inspirations, weekStart, weekEnd, query, tagById]
  );

  const groups = new Map<number, typeof read>();
  for (const i of read) {
    const k = startOfDay(i.completedDate!);
    groups.set(k, [...(groups.get(k) ?? []), i]);
  }

  return (
    <main className="scroll-page reading-history-page">
      <Backdrop soft />
      <ReadingHeader title="Read History" active="history" query={query} onQuery={setQuery} fixed />

      <InertialY className="page">
        <WeekReadingCard
          items={read}
          tagById={tagById}
          weekStart={weekStart}
          onPickWeek={() => setPick(true)}
          stamp={(i) => i.completedDate!}
        />

        <section style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {[...groups.entries()].map(([day, items]) => (
            <div key={day} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
              <h3 className="day-head">
                {new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {new Date(day).toLocaleDateString("en-US", { weekday: "short" })}
              </h3>
              {items.map((i) => (
                <FlatItem key={i.id} item={i} size="sm" onOpen={() => router.push(`/inspiration?id=${i.id}`)} />
              ))}
            </div>
          ))}
          {read.length === 0 && (
            <p className="body13 muted" style={{ margin: 0 }}>Items you mark as read in this week will show up here.</p>
          )}
        </section>
      </InertialY>

      <Drawer open={pick} onClose={() => setPick(false)} label="Pick a week">
        <SubClose>
          {(close) => (
            <DatePickerPanel
              title="Select Week" value={weekStart} withTime={false} marks={buildMarks(inspirations)}
              onCancel={close}
              onSave={(ms) => { if (ms) setWeekStart(mondayOf(ms)); close(); }}
            />
          )}
        </SubClose>
      </Drawer>
      <BottomNav />
    </main>
  );
}
