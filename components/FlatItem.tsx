"use client";
import type { ReactNode } from "react";
import { effectiveStatus, type Inspiration } from "@/lib/types";
import { useStore } from "./Store";
import { Palette } from "./ui";
import { IconImage } from "./Icons";

const hhmm = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Status/time column used by "item card flat". */
export function statusMeta(i: Inspiration) {
  const s = effectiveStatus(i);
  if (s === "completed") return { time: hhmm(i.completedDate ?? i.updatedAt), label: "Read", late: false };
  if (s === "overdue") return { time: hhmm(i.scheduledDate!), label: "Overdue", late: true };
  if (s === "scheduled") return { time: hhmm(i.scheduledDate!), label: "Pending", late: false };
  return { time: new Date(i.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }), label: "Saved", late: false };
}

/** "item card flat" (Library) and "item card flat2" (Reading) */
export function FlatItem({
  item, size = "lg", onOpen, right, showPalette = true,
}: {
  item: Inspiration;
  size?: "lg" | "sm";
  onOpen: () => void;
  right?: ReactNode;
  showPalette?: boolean;
}) {
  const { imageUrl, tagById } = useStore();
  const src = imageUrl(item.imageId);
  const labels = item.tags.map((t) => tagById.get(t)?.name).filter(Boolean) as string[];
  const meta = statusMeta(item);
  return (
    <div className={`flat${size === "sm" ? " sm" : ""}`}>
      <button type="button" onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textAlign: "left" }}>
        <span className="thumb-sq">{src ? <img src={src} alt="" loading="lazy" /> : <IconImage size={24} />}</span>
        <span className="body">
          <span className="title">{item.title || "Untitled"}</span>
          <span className="sub">
            {showPalette && size === "lg" && item.palette.length > 0 && <Palette colors={item.palette.slice(0, 5)} size="s" />}
            {labels.length > 0 && (
              <span className="kw">{labels.slice(0, 3).map((l) => <span key={l}>{l}</span>)}</span>
            )}
          </span>
        </span>
      </button>
      {right ?? (
        <span className="meta">
          <b>{meta.time}</b>
          <small className={meta.late ? "late" : ""}>{meta.label}</small>
        </span>
      )}
    </div>
  );
}
