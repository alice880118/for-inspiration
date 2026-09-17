"use client";
import { useEffect, useRef, useState } from "react";
import { reorderTags } from "@/lib/db";
import type { Tag } from "@/lib/types";
import { useStore } from "@/components/Store";
import { Backdrop, Drawer } from "@/components/ui";
import { PageNav } from "@/components/PageNav";
import { SubClose } from "@/components/FormParts";
import { CategoryPanel } from "@/components/Panels";
import { IconChevron, IconClose, IconGrip, IconPlusSm, IconSearch } from "@/components/Icons";

/** 07 Manage Categories (Figma 257:1658) — drag to reorder, tap to edit, add. */
export default function ManageCategories() {
  const { tags, inspirations, refresh } = useStore();
  const [order, setOrder] = useState<Tag[]>(tags);
  const [panel, setPanel] = useState<null | { tag: Tag | null }>(null);
  const [q, setQ] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dy, setDy] = useState(0);
  const drag = useRef<{ id: string; startY: number; rowH: number; from: number } | null>(null);

  useEffect(() => setOrder(tags), [tags]);

  const count = (id: string) => inspirations.filter((i) => i.tags.includes(id)).length;
  const shown = q ? order.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())) : order;

  const onDown = (e: React.PointerEvent, t: Tag) => {
    if (q) return;
    const row = (e.currentTarget as HTMLElement).closest(".cat-row") as HTMLElement;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: t.id, startY: e.clientY, rowH: row.offsetHeight, from: order.findIndex((x) => x.id === t.id) };
    setDragId(t.id);
    setDy(0);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const delta = e.clientY - d.startY;
    const cur = order.findIndex((x) => x.id === d.id);
    const target = Math.max(0, Math.min(order.length - 1, d.from + Math.round(delta / d.rowH)));
    if (target !== cur) {
      const next = [...order];
      const [m] = next.splice(cur, 1);
      next.splice(target, 0, m);
      setOrder(next);
    }
    setDy(delta - (target - d.from) * d.rowH);
  };
  const onUp = async () => {
    if (!drag.current) return;
    drag.current = null;
    setDragId(null);
    setDy(0);
    await reorderTags(order.map((t) => t.id));
    await refresh();
  };

  const move = async (t: Tag, dir: -1 | 1) => {
    const i = order.findIndex((x) => x.id === t.id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    await reorderTags(next.map((x) => x.id));
    await refresh();
  };

  return (
    <main className="page page-top">
      <Backdrop soft />
      <PageNav
        title="Manage Categories"
        right={
          <button className="icon-btn" aria-label={q === null ? "Search categories" : "Close search"} onClick={() => setQ(q === null ? "" : null)}>
            {q === null ? <IconSearch /> : <IconClose />}
          </button>
        }
      />
      {q !== null && (
        <label className="input search-inline">
          <IconSearch size={18} />
          <input autoFocus placeholder="Search categories" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      )}

      <div role="list" style={{ marginTop: 16, padding: "0 8px" }}>
        {shown.map((t) => (
          <div
            key={t.id}
            role="listitem"
            className={`cat-row${dragId === t.id ? " dragging" : ""}`}
            style={dragId === t.id ? { transform: `translateY(${dy}px)` } : undefined}
          >
            <span
              className="grip"
              role="button"
              tabIndex={0}
              aria-label={`Reorder ${t.name}. Use arrow keys to move.`}
              onPointerDown={(e) => onDown(e, t)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") { e.preventDefault(); move(t, -1); }
                if (e.key === "ArrowDown") { e.preventDefault(); move(t, 1); }
              }}
            >
              <IconGrip />
            </span>
            <button onClick={() => setPanel({ tag: t })} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <span className="dotc" style={{ background: t.displayColor }} />
              <span className="name">{t.name}</span>
              <span className="cnt">{count(t.id)}<IconChevron /></span>
            </button>
          </div>
        ))}
        {shown.length === 0 && <p className="body13 muted">No categories match.</p>}
        <button className="add-row" onClick={() => setPanel({ tag: null })}>
          <IconPlusSm /> Add Category
        </button>
      </div>

      <Drawer open={!!panel} onClose={() => setPanel(null)} label={panel?.tag ? "Edit Classify Tag" : "Add Classify Tag"}>
        <SubClose>
          {(close) => panel && <CategoryPanel tag={panel.tag} onCancel={close} onDone={() => close()} />}
        </SubClose>
      </Drawer>
    </main>
  );
}
