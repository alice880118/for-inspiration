"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { patchInspiration } from "@/lib/db";
import { computeNotices, thisWeekend } from "@/lib/notify";
import { effectiveStatus } from "@/lib/types";
import { useStore } from "@/components/Store";
import { AppIcon, IconClose, IconSearch } from "@/components/Icons";
import { Backdrop, ConfirmModal } from "@/components/ui";
import { PageNav } from "@/components/PageNav";

/** Notification Center (Figma 277:2232) — derived from the reading schedule, nothing leaves the device. */
export default function NotificationCenter() {
  const router = useRouter();
  const { inspirations, tagById, refresh, toast } = useStore();
  const [q, setQ] = useState<string | null>(null);
  const [confirmMove, setConfirmMove] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const notices = computeNotices(inspirations, tagById).filter(
    (n) => !q || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase())
  );
  const overdue = inspirations.filter((i) => effectiveStatus(i) === "overdue");
  const weekend = thisWeekend();

  const goBack = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => router.push("/settings"), 400);
  };

  return (
    <main className={`page page-top page-fade${leaving ? " is-leaving" : ""}`}>
      <Backdrop soft />
      <PageNav
        title="Notification Center"
        onBack={goBack}
        right={
          <button className="icon-btn" aria-label={q === null ? "Search notifications" : "Close search"} onClick={() => setQ(q === null ? "" : null)}>
            {q === null ? <IconSearch /> : <IconClose />}
          </button>
        }
      />
      {q !== null && (
        <label className="input search-inline">
          <IconSearch size={18} />
          <input autoFocus placeholder="Search notifications" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {notices.map((n) => (
          <button key={n.id} className="notif" onClick={() => (n.kind === "overdue" ? setConfirmMove(true) : router.push("/reading"))}>
            <AppIcon width={40} />
            <span>
              <b>{n.title}</b>
              <small>{n.body}</small>
            </span>
          </button>
        ))}
        {notices.length === 0 && (
          <div className="empty" style={{ padding: "80px 16px" }}>
            <p className="h2">You’re all caught up</p>
            <p className="body13 muted" style={{ margin: 0 }}>Reminders for scheduled and overdue case studies appear here.</p>
          </div>
        )}
      </div>
      {confirmMove && (
        <ConfirmModal
          title={`Move ${overdue.length} item${overdue.length > 1 ? "s" : ""} to this weekend?`}
          body={`They’ll be rescheduled to ${new Date(weekend).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`}
          confirm="Move"
          onCancel={() => setConfirmMove(false)}
          onConfirm={async () => {
            for (const i of overdue) await patchInspiration(i.id, { scheduledDate: weekend, readingStatus: "scheduled" });
            await refresh();
            setConfirmMove(false);
            toast(`Moved ${overdue.length} to this weekend`);
          }}
        />
      )}
    </main>
  );
}
