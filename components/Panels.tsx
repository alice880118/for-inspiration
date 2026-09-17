"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTag, deleteTag, updateTag } from "@/lib/db";
import type { Tag } from "@/lib/types";
import { ColorPickerPanel } from "./ColorPicker";
import { useStore } from "./Store";
import { IconChevron, IconClose, IconEyedropper } from "./Icons";
import { DeletePopup } from "@/app/packages/feedback/DeletePopup";

export const TAG_COLORS = ["#E0E5F0", "#F7C8CB", "#C2E8C9", "#FAE2BF", "#D9C8F0", "#C8E9EC", "#AAD7F9", "#FFD6E8", "#E8F5A8", "#FFC9A8"];

export function Actions({ onCancel, onSave, saveLabel = "Save", disabled = false }: { onCancel: () => void; onSave: () => void; saveLabel?: string; disabled?: boolean }) {
  return (
    <div className="form-actions">
      <button type="button" className="btn-m line" onClick={onCancel}>Cancel</button>
      <button type="button" className="btn-m fill" disabled={disabled} onClick={onSave}>{saveLabel}</button>
    </div>
  );
}

/** Chip list + add input — used by "Edit Font" (276:2514) and the Tags editor. */
export function ChipListPanel({
  title, listLabel, addLabel, placeholder, values, onSave, onCancel, suggestions = [],
}: {
  title: string; listLabel: string; addLabel: string; placeholder: string;
  values: string[]; onSave: (v: string[]) => void; onCancel: () => void; suggestions?: string[];
}) {
  const [list, setList] = useState(values);
  const [text, setText] = useState("");
  const add = (raw = text) => {
    const names = raw.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setList((l) => [...l, ...names.filter((n) => !l.some((x) => x.toLowerCase() === n.toLowerCase()))]);
    setText("");
  };
  const sugg = suggestions.filter((s) => !list.includes(s) && (!text || s.toLowerCase().includes(text.toLowerCase()))).slice(0, 8);
  return (
    <div className="drawer-body">
      <h2 className="drawer-title">{title}</h2>
      <div className="field">
        <div className="field-head"><span className="label">{listLabel}</span></div>
        {list.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {list.map((f) => (
              <span key={f} className="chip-x">
                {f}
                <button type="button" aria-label={`Remove ${f}`} onClick={() => setList((l) => l.filter((x) => x !== f))}>
                  <IconClose size={14} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="body13 muted" style={{ margin: 0 }}>Nothing yet.</p>
        )}
      </div>
      <div className="field">
        <div className="field-head"><span className="label">{addLabel}</span></div>
        <label className="input">
          <span className="sr-only">{addLabel}</span>
          <input
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            enterKeyHint="done"
          />
          {text && (
            <button type="button" className="btn-link" style={{ color: "var(--black)" }} onClick={() => add()}>Add</button>
          )}
        </label>
        {sugg.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sugg.map((s) => (
              <button key={s} type="button" className="font-tag dashed" onClick={() => add(s)}>+ {s}</button>
            ))}
          </div>
        )}
      </div>
      <Actions onCancel={onCancel} onSave={() => onSave(text.trim() ? [...list, ...text.split(/[,，、]/).map((s) => s.trim()).filter((n) => n && !list.includes(n))] : list)} />
    </div>
  );
}

/** "Add Classify Tag" (277:1719 / 277:2380) and "Edit Classify Tag" (277:2031), with the color sub-view (282:1590). */
export function CategoryPanel({
  tag, onDone, onCancel, showManageLink = false,
}: {
  tag?: Tag | null;
  onDone: (t: Tag | null) => void;
  onCancel: () => void;
  showManageLink?: boolean;
}) {
  const router = useRouter();
  const { tags, inspirations, refresh, toast, closeAdd } = useStore();
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.displayColor ?? TAG_COLORS[(tags.length + 6) % TAG_COLORS.length]);
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const dup = tags.some((t) => t.id !== tag?.id && t.name.toLowerCase() === name.trim().toLowerCase());

  if (picking) {
    return (
      <ColorPickerPanel
        colors={[color]}
        multi={false}
        onBack={() => setPicking(false)}
        onCancel={() => setPicking(false)}
        onSave={([c]) => {
          setColor(c.slice(0, 7));
          setPicking(false);
        }}
      />
    );
  }

  return (
    <div className="drawer-body">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 className="drawer-title" style={{ flex: 1 }}>{tag ? "Edit Classify Tag" : "Add Classify Tag"}</h2>
        {showManageLink && (
          <button
            type="button"
            className="manage-link"
            onClick={() => {
              closeAdd();
              onCancel();
              router.push("/settings/categories");
            }}
          >
            Manage Categories <IconChevron />
          </button>
        )}
      </div>
      <div className="field">
        <div className="field-head"><span className="label">Name</span></div>
        <label className="input">
          <span className="sr-only">Name</span>
          <input autoFocus={!tag} placeholder="Add Classify Tag Name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
          {name && (
            <button type="button" className="clear-btn" aria-label="Clear name" onClick={() => setName("")}>
              <IconClose size={18} />
            </button>
          )}
        </label>
        {dup && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>A category with this name already exists.</p>}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          className="color-chip"
          style={{ background: color }}
          aria-label="Open color picker"
          onClick={() => setPicking(true)}
        />
        <button type="button" className="replace-color" onClick={() => setPicking(true)}>
          <IconEyedropper />
          <span>
            <b>Replace color</b>
            <small>Pick a new color</small>
          </span>
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Actions
          onCancel={onCancel}
          disabled={!name.trim() || dup}
          onSave={async () => {
            if (tag) {
              const t = { ...tag, name: name.trim(), displayColor: color };
              await updateTag(t);
              await refresh();
              onDone(t);
            } else {
              const t = await createTag(name, color);
              await refresh();
              onDone(t);
            }
          }}
        />
        {tag && (
          <button type="button" className="btn-link" style={{ color: "var(--danger)", alignSelf: "flex-start" }} onClick={() => setConfirmDel(true)}>
            Delete this category
          </button>
        )}
      </div>
      {confirmDel && tag && (
        <DeletePopup
          name={tag.name}
          count={inspirations.filter((i) => i.tags.includes(tag.id)).length}
          onCancel={() => setConfirmDel(false)}
          onConfirm={async () => {
            const used = inspirations.filter((i) => i.tags.includes(tag.id)).length;
            const label = tag.name;
            await deleteTag(tag.id);
            await refresh();
            setConfirmDel(false);
            onDone(null);
            if (used > 0) {
              toast(`“${label}” deleted. ${used} cards need categories`, {
                label: "Organize now",
                run: () => router.push("/library"),
              });
            } else {
              toast(`Deleted “${label}”`);
            }
          }}
        />
      )}
    </div>
  );
}
