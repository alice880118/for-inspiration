export type ReadingStatus = "none" | "scheduled" | "completed";

/** A Category — shown in the UI as "Classify Tag". */
export interface Tag {
  id: string;
  name: string;
  /** UI identification color only — never used for Color Search */
  displayColor: string;
  order: number;
}

export interface Inspiration {
  id: string;
  title: string;
  sourceUrl: string;
  /** key in the `images` store (same as inspiration id), or null */
  imageId: string | null;
  note: string;
  tags: string[]; // Category ("Classify Tag") ids
  keywords: string[]; // free-form tags (Manage Tags)
  palette: string[]; // detected / edited image colors (hex)
  fonts: string[]; // detected / edited font names
  readingStatus: ReadingStatus;
  scheduledDate: number | null; // epoch ms
  completedDate: number | null; // epoch ms
  createdAt: number;
  updatedAt: number;
}

export type InspirationDraft = Omit<Inspiration, "id" | "createdAt" | "updatedAt" | "imageId"> & {
  /** Blob to write; `null` clears; `undefined` leaves the stored image unchanged. */
  imageBlob?: Blob | null;
};

/** Overdue is derived, never stored (IA §9) */
export function effectiveStatus(i: Inspiration, now = Date.now()): "none" | "scheduled" | "overdue" | "completed" {
  if (i.readingStatus === "completed") return "completed";
  if (i.readingStatus === "scheduled" && i.scheduledDate) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return i.scheduledDate < today.getTime() ? "overdue" : "scheduled";
  }
  return "none";
}
