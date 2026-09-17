"use client";
import { getMeta, setMeta } from "./db";
import { effectiveStatus, type Inspiration, type Tag } from "./types";
import { sameDay } from "./filter";

/**
 * Local-only reminders. There is no push server, so notifications fire while Pobbi
 * is open (or recently backgrounded) — enough for an MVP; real push needs a backend.
 */
export async function notificationsEnabled() {
  return getMeta<boolean>("notifyEnabled", false);
}

export async function setNotificationsEnabled(on: boolean): Promise<boolean> {
  if (on && "Notification" in window && Notification.permission !== "granted") {
    const p = await Notification.requestPermission().catch(() => "denied" as NotificationPermission);
    if (p !== "granted") {
      await setMeta("notifyEnabled", true); // keep in-app reminders even without OS permission
      return true;
    }
  }
  await setMeta("notifyEnabled", on);
  return on;
}

export async function showNotification(title: string, body: string, url = "/reading") {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url }, tag: "pobbi-reading" });
    else new Notification(title, { body, icon: "/icons/icon-192.png" });
    return true;
  } catch {
    return false;
  }
}

const SNOOZE_KEY = "reminderSnoozeUntil";

/** Unread inspirations whose scheduled time has already passed. */
export function dueUnread(items: Inspiration[], now = Date.now()) {
  return items
    .filter((i) => i.readingStatus !== "completed" && i.scheduledDate != null && i.scheduledDate <= now)
    .sort((a, b) => a.scheduledDate! - b.scheduledDate!);
}

export async function getReminderSnoozeUntil(): Promise<number> {
  return getMeta<number>(SNOOZE_KEY, 0);
}

export async function setReminderSnoozeUntil(until: number) {
  await setMeta(SNOOZE_KEY, until);
}

export async function remindLater(minutes: number, count: number): Promise<string> {
  const granted = "Notification" in window && Notification.permission === "granted";
  setTimeout(() => {
    showNotification("Today’s Case Study reminder", `You still have ${count} case ${count > 1 ? "studies" : "study"} to read today.`);
  }, minutes * 60_000);
  return granted ? `We’ll remind you in ${minutes} minutes` : `Reminder set for ${minutes} min (keep Pobbi open)`;
}

/** Called once on app start: one OS notification per day when something is due. */
export async function dailyCheck(items: Inspiration[]) {
  if (!(await notificationsEnabled())) return;
  const today = new Date().toDateString();
  if ((await getMeta<string>("lastDailyNotify", "")) === today) return;
  const due = items.filter((i) => effectiveStatus(i) === "scheduled" && sameDay(i.scheduledDate!, Date.now()));
  if (!due.length) return;
  if (await showNotification(`${due.length} inspiration${due.length > 1 ? "s" : ""} scheduled today`, due.map((d) => d.title).slice(0, 3).join(" · "))) {
    await setMeta("lastDailyNotify", today);
  }
}

export interface AppNotice {
  id: string;
  title: string;
  body: string;
  kind: "today" | "overdue";
}

export function computeNotices(items: Inspiration[], tagById: Map<string, Tag>): AppNotice[] {
  const out: AppNotice[] = [];
  const today = items
    .filter((i) => effectiveStatus(i) === "scheduled" && sameDay(i.scheduledDate!, Date.now()))
    .sort((a, b) => a.scheduledDate! - b.scheduledDate!);
  if (today.length) {
    const byTag = new Map<string, number>();
    for (const i of today) for (const t of i.tags.length ? i.tags : ["_"]) byTag.set(t, (byTag.get(t) ?? 0) + 1);
    const parts = [...byTag.entries()].slice(0, 3).map(([t, n]) => `${tagById.get(t)?.name ?? "Other"} ${n}`);
    const first = new Date(today[0].scheduledDate!).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
    out.push({
      id: "today",
      kind: "today",
      title: `${today.length} inspiration${today.length > 1 ? "s" : ""} scheduled today`,
      body: [...parts, first].join(" · "),
    });
  }
  const overdue = items.filter((i) => effectiveStatus(i) === "overdue");
  if (overdue.length) {
    out.push({
      id: "overdue",
      kind: "overdue",
      title: `${overdue.length} overdue item${overdue.length > 1 ? "s" : ""}`,
      body: "Move them to this weekend?",
    });
  }
  return out;
}

/** Next Saturday 10:00 (or today if it is Saturday and before 10:00). */
export function thisWeekend() {
  const d = new Date();
  const add = (6 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  d.setHours(10, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 7);
  return d.getTime();
}
