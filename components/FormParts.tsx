"use client";
import { useRef, useState } from "react";
import type { Tag } from "@/lib/types";
import { useStore } from "./Store";
import type { Draft } from "./useDraft";
import { Drawer, Palette, TagPill, useDrawerClose } from "./ui";
import { ChipListPanel, CategoryPanel } from "./Panels";
import { ColorPickerPanel } from "./ColorPicker";
import { DatePickerPanel, buildMarks } from "./Calendar";
import {
  IconCalendarAdd, IconCheckbox, IconClose, IconImageSparkle, IconImageUpload, IconLink, IconPencil, IconPlus, IconUpload,
} from "./Icons";

export { TAG_COLORS } from "./Panels";

/* ---------- URL ---------- */
function clipUrl(raw: string) {
  const text = raw.trim();
  const http = text.match(/https?:\/\/[^\s]+/i);
  if (http) return http[0];
  const host = text.match(/(?:www\.)?[\w-]+(?:\.[\w-]+)+(?:\/[^\s]*)?/i);
  return host ? host[0] : text;
}

export function UrlField({ draft, glass = false, label = "URL", placeholder = "Paste URL" }: { draft: Draft; glass?: boolean; label?: string; placeholder?: string }) {
  const { d, patch, fetchFromUrl, fetched, setFetched, busy } = draft;
  const { toast } = useStore();
  const has = d.sourceUrl.trim().length > 0;

  const pasteClipboard = async () => {
    try {
      const text = clipUrl(await navigator.clipboard.readText());
      if (!text) {
        toast("Clipboard is empty");
        return;
      }
      patch({ sourceUrl: text });
      setFetched(false);
      await fetchFromUrl(text);
    } catch {
      toast("Allow clipboard access, or paste into the field");
    }
  };

  return (
    <div className="field">
      <div className="field-head"><span className={glass ? "label" : "label"} style={glass ? { fontSize: 12 } : undefined}>{label}</span></div>
      <div className="input-row">
        <label className={`input${glass ? " glass" : ""}`}>
          <span className="sr-only">{label}</span>
          <input
            type="text"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
            autoComplete="off"
            placeholder={placeholder}
            value={d.sourceUrl}
            onChange={(e) => {
              patch({ sourceUrl: e.target.value });
              setFetched(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                fetchFromUrl();
              }
            }}
            onPaste={(e) => {
              const text = clipUrl(e.clipboardData.getData("text"));
              if (text && /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(text)) {
                e.preventDefault();
                patch({ sourceUrl: text });
                fetchFromUrl(text);
              }
            }}
          />
          {has && (
            <button type="button" className="clear-btn" aria-label="Clear URL" onClick={() => { patch({ sourceUrl: "" }); setFetched(false); }}>
              <IconClose size={16} />
            </button>
          )}
        </label>
        <button
          type="button"
          className={`btn-icon-fill${fetched ? " done" : ""}`}
          aria-label="Paste URL from clipboard"
          disabled={busy === "meta"}
          onClick={pasteClipboard}
        >
          {busy === "meta" ? <Spinner /> : <IconLink />}
        </button>
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Loading" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="40 20" strokeLinecap="round" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

/* ---------- Thumbnail ---------- */
export function ThumbPicker({ draft }: { draft: Draft }) {
  const { previewUrl, setImage, patch, busy, d, useWebImage, fetchFromUrl } = draft;
  const { toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [choose, setChoose] = useState(false);

  const fromWeb = async () => {
    if (!d.sourceUrl.trim()) return toast("Paste a website URL first");
    let imgs = d.webImages;
    if (!imgs.length) imgs = (await fetchFromUrl())?.images ?? [];
    if (imgs.length > 1) setChoose(true);
    else if (imgs.length === 1) useWebImage(imgs[0]);
    else toast("No images found on that page");
  };

  return (
    <div className="thumb-col">
      <div className={`thumb${previewUrl ? " filled" : ""}`}>
        {previewUrl ? (
          <>
            <img className="cover" src={previewUrl} alt="Selected thumbnail" />
            <button type="button" className="thumb-x" aria-label="Remove image" onClick={() => patch({ imageBlob: null, palette: [] })}>
              <IconClose size={18} />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Choose image" style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", position: "absolute", inset: 0 }}>
            <IconImageUpload />
          </button>
        )}
        {busy === "image" && <div className="busy"><Spinner /></div>}
      </div>
      <div className="input-row">
        <button type="button" className="btn-select" onClick={() => fileRef.current?.click()}>
          Select <IconUpload />
        </button>
        <button type="button" className="btn-icon-line" aria-label="Fetch image from website" onClick={fromWeb}>
          <IconImageSparkle />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setImage(f);
          e.target.value = "";
        }}
      />
      <Drawer open={choose} onClose={() => setChoose(false)} label="Choose Image" sub>
        <ChooseImage images={d.webImages} onPick={(u) => { useWebImage(u); setChoose(false); }} />
      </Drawer>
    </div>
  );
}

function ChooseImage({ images, onPick }: { images: string[]; onPick: (u: string) => void }) {
  const [sel, setSel] = useState<string | null>(images[0] ?? null);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  return (
    <div className="drawer-body">
      <h2 className="drawer-title">Choose Image</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {images.filter((u) => !broken.has(u)).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setSel(u)}
            aria-pressed={sel === u}
            style={{ aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "#e8e8e8", outline: sel === u ? "2.5px solid #000" : "none", outlineOffset: 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/image?url=${encodeURIComponent(u)}`} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setBroken((b) => new Set(b).add(u))} />
          </button>
        ))}
      </div>
      <button type="button" className="btn-m fill" style={{ flex: "none" }} disabled={!sel} onClick={() => sel && onPick(sel)}>
        Use Selected Image
      </button>
    </div>
  );
}

/* ---------- Name ---------- */
export function NameField({ draft }: { draft: Draft }) {
  const { d, patch } = draft;
  return (
    <div className="field">
      <div className="field-head"><span className="label-m">Name</span></div>
      <label className="input">
        <span className="sr-only">Name</span>
        <input placeholder="Add Name" value={d.title} maxLength={80} onChange={(e) => patch({ title: e.target.value })} />
        {d.title && (
          <button type="button" className="clear-btn" aria-label="Clear name" onClick={() => patch({ title: "" })}>
            <IconClose size={16} />
          </button>
        )}
      </label>
    </div>
  );
}

/* ---------- Fonts + Colors (Visual info) ---------- */
export function VisualFields({ draft }: { draft: Draft }) {
  const { d, patch, previewUrl } = draft;
  const [fontOpen, setFontOpen] = useState(false);
  const [color, setColor] = useState<number | null>(null); // index to start on, -1 = add
  return (
    <>
      <div className="field">
        <div className="field-head">
          <span className="label-m">Font</span>
          <button type="button" className="icon-btn" aria-label="Edit fonts" onClick={() => setFontOpen(true)} style={{ color: "var(--gray)" }}>
            <IconPencil />
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {d.fonts.map((f) => <span key={f} className="font-tag">{f}</span>)}
          {d.fonts.length === 0 && (
            <button type="button" className="font-tag dashed" onClick={() => setFontOpen(true)}>Add Font</button>
          )}
        </div>
      </div>
      <div style={{ padding: "4px 0" }}>
        <Palette colors={d.palette} onPick={(i) => setColor(i)} onAdd={() => setColor(-1)} />
      </div>

      <Drawer open={fontOpen} onClose={() => setFontOpen(false)} label="Edit Font" sub>
        <SubClose>
          {(close) => (
            <ChipListPanel
              title="Edit Font" listLabel="Font" addLabel="Add Font" placeholder="Add Font"
              values={d.fonts}
              suggestions={["Inter", "Noto Sans TC", "Montserrat", "Roboto", "SF Pro", "Helvetica Neue", "Poppins", "DM Sans"]}
              onCancel={close}
              onSave={(v) => { patch({ fonts: v }); close(); }}
            />
          )}
        </SubClose>
      </Drawer>
      <Drawer open={color !== null} onClose={() => setColor(null)} label="Color picker" sub>
        <SubClose>
          {(close) => (
            <ColorPickerPanel
              colors={color === -1 ? [...d.palette, d.palette.at(-1) ?? "#AAD7F9"] : d.palette}
              startIndex={color === -1 ? d.palette.length : color ?? 0}
              image={previewUrl}
              onCancel={close}
              onSave={(v) => { patch({ palette: v }); close(); }}
            />
          )}
        </SubClose>
      </Drawer>
    </>
  );
}

/** Render-prop helper so panel buttons can use the drawer's animated close. */
export function SubClose({ children }: { children: (close: () => void) => React.ReactNode }) {
  const close = useDrawerClose();
  return <>{children(close)}</>;
}

/* ---------- Categories (Classify Tag) ---------- */
export function TagField({ draft }: { draft: Draft }) {
  const { d, patch } = draft;
  const { tags } = useStore();
  const [editing, setEditing] = useState(false);
  const [panel, setPanel] = useState<null | { tag: Tag | null }>(null);
  const toggle = (id: string) => patch({ tags: d.tags.includes(id) ? d.tags.filter((t) => t !== id) : [...d.tags, id] });

  return (
    <div className="field">
      <div className="field-head">
        <span className="label">Classify Tag</span>
        <button type="button" className="icon-btn" aria-label={editing ? "Done editing categories" : "Edit categories"} aria-pressed={editing} onClick={() => setEditing((v) => !v)} style={{ color: editing ? "var(--main-01)" : "var(--gray)" }}>
          <IconPencil />
        </button>
      </div>
      <div className="tag-wrap">
        {tags.map((t) => (
          <TagPill key={t.id} tag={t} on={d.tags.includes(t.id)} editing={editing}
            onClick={() => (editing ? setPanel({ tag: t }) : toggle(t.id))} />
        ))}
        <button type="button" className="tag-add" aria-label="Add category" onClick={() => setPanel({ tag: null })}>
          <IconPlus size={20} strokeWidth={1} />
        </button>
      </div>
      {editing && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Tap a category to rename, recolor or delete it.</p>}
      <Drawer open={!!panel} onClose={() => setPanel(null)} label={panel?.tag ? "Edit Classify Tag" : "Add Classify Tag"} sub>
        <SubClose>
          {(close) => panel && (
            <CategoryPanel
              tag={panel.tag}
              showManageLink={!panel.tag}
              onCancel={close}
              onDone={(t) => {
                if (!panel.tag && t && !d.tags.includes(t.id)) patch({ tags: [...d.tags, t.id] });
                if (panel.tag && !t) patch({ tags: d.tags.filter((x) => x !== panel.tag!.id) });
                close();
              }}
            />
          )}
        </SubClose>
      </Drawer>
    </div>
  );
}

/* ---------- Purpose / Reading schedule ---------- */
const fmt = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

export function PurposeField({
  draft, hideCalendar = false, scheduleOpen, setScheduleOpen,
}: { draft: Draft; hideCalendar?: boolean; scheduleOpen?: boolean; setScheduleOpen?: (v: boolean) => void }) {
  const { d, patch } = draft;
  const { inspirations } = useStore();
  const [localOpen, setLocalOpen] = useState(false);
  const open = scheduleOpen ?? localOpen;
  const setOpen = setScheduleOpen ?? setLocalOpen;
  const checked = d.readingStatus === "completed" || !!d.scheduledDate;

  return (
    <div className="field">
      <div className="field-head"><span className="label">Purposes</span></div>
      <div className="purpose">
        <button type="button" className="grow" role="checkbox" aria-checked={checked}
          onClick={() => {
            if (checked) patch({ scheduledDate: null, readingStatus: "none" });
            else setOpen(true);
          }}>
          <IconCheckbox checked={checked} />
          For Case study
          {d.readingStatus === "completed" ? <span className="when">· Read</span> : d.scheduledDate ? <span className="when">· {fmt(d.scheduledDate)}</span> : null}
        </button>
        {!hideCalendar && (
          <button type="button" className="icon-btn" aria-label="Schedule reading" onClick={() => setOpen(true)} style={{ color: "var(--gray)" }}>
            <IconCalendarAdd />
          </button>
        )}
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} label="Date Picker" sub>
        <SubClose>
          {(close) => (
            <DatePickerPanel
              value={d.scheduledDate}
              marks={buildMarks(inspirations)}
              allowClear
              onCancel={close}
              onSave={(ms) => {
                patch(ms ? { scheduledDate: ms, readingStatus: "scheduled" } : { scheduledDate: null, readingStatus: "none" });
                close();
              }}
            />
          )}
        </SubClose>
      </Drawer>
    </div>
  );
}

export function NoteField({ draft }: { draft: Draft }) {
  const { d, patch } = draft;
  return (
    <label className="input area">
      <span className="sr-only">Note</span>
      <textarea rows={1} placeholder="Note" value={d.note} maxLength={2000}
        onChange={(e) => {
          patch({ note: e.target.value });
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }} />
    </label>
  );
}
