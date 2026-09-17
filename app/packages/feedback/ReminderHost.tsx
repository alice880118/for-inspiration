"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Inspiration } from "@/lib/types";
import { dueUnread, getReminderSnoozeUntil, remindLater, setReminderSnoozeUntil } from "@/lib/notify";
import { ReminderPopup } from "./ReminderPopup";

/** Global reminder: scheduled time has passed and the inspiration is still unread. */
export function ReminderHost({
  inspirations,
  toast,
}: {
  inspirations: Inspiration[];
  toast: (msg: string) => void;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [snoozeUntil, setSnoozeUntil] = useState(0);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    getReminderSnoozeUntil().then(setSnoozeUntil).catch(() => {});
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 15_000);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const due = useMemo(() => dueUnread(inspirations, now), [inspirations, now]);
  const dueKey = due.map((i) => `${i.id}:${i.scheduledDate}`).join("|");
  const visible = due.length > 0 && now >= snoozeUntil && dismissedKey !== dueKey;

  const hideForThisSet = () => setDismissedKey(dueKey);

  if (!visible) return null;
  return (
    <div className="fb-reminder-host">
      <ReminderPopup
        count={due.length}
        onSnooze={async () => {
          const until = Date.now() + 10 * 60_000;
          await setReminderSnoozeUntil(until);
          setSnoozeUntil(until);
          toast(await remindLater(10, due.length));
        }}
        onReadNow={() => {
          hideForThisSet();
          const first = due[0];
          if (first.sourceUrl) window.open(first.sourceUrl, "_blank", "noopener,noreferrer");
          router.push(`/inspiration?id=${first.id}`);
        }}
        onEditSchedule={() => {
          hideForThisSet();
          router.push("/reading");
        }}
      />
    </div>
  );
}
