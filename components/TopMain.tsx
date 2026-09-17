"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Inspiration } from "@/lib/types";
import { useStore } from "./Store";
import { Drawer } from "./ui";
import { SubClose } from "./FormParts";
import { ColorPickerPanel } from "./ColorPicker";
import { IconClose, IconDots9, IconSearch, IconSort } from "./Icons";

export type SortKey = "recent" | "oldest" | "az";
export const SORT_LABEL: Record<SortKey, string> = { recent: "Recently Added", oldest: "Oldest", az: "A–Z" };

/**
 * "top main nav": search + color search + settings, then filter icon + category chips.
 * Home: single active chip. Library: multi-select chips + filter drawer.
 */
export function TopMain({
  query, setQuery, color, setColor, items,
  selected, onChip, onAll, onFilter, filterActive = false, below,
}: {
  query: string; setQuery: (v: string) => void;
  color: string | null; setColor: (v: string | null) => void;
  items: Inspiration[];
  selected: string[];
  onChip: (id: string) => void;
  onAll: () => void;
  onFilter?: () => void;
  filterActive?: boolean;
  below?: ReactNode;
}) {
  const { tags } = useStore();
  const router = useRouter();
  const [colorOpen, setColorOpen] = useState(false);
  const counts = new Map<string, number>();
  for (const i of items) for (const t of i.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const fmt = (n: number) => (n > 99 ? "99+" : String(n));

  useEffect(() => {
    router.prefetch("/settings");
  }, [router]);

  return (
    <div className="top-main">
      <div className="top-nav">
        <label className="search">
          <IconSearch />
          <span className="sr-only">Search inspirations</span>
          <input
            type="text"
            inputMode="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            enterKeyHint="search"
          />
          {(query || color) && (
            <button type="button" className="clear-btn" aria-label="Clear search" onClick={() => { setQuery(""); setColor(null); }} style={{ color: "#d4d4d4" }}>
              <IconClose />
            </button>
          )}
          <button
            type="button"
            className={`color-dot${color ? " on" : ""}`}
            style={color ? { background: color } : undefined}
            aria-label={color ? `Color search: ${color}` : "Search by color"}
            onClick={(e) => {
              e.preventDefault();
              setColorOpen(true);
            }}
          />
        </label>
        <Link
          href="/settings"
          prefetch
          aria-label="Settings"
          className="icon-btn"
          style={{ margin: 0, width: 32, height: 32, flex: "none" }}
        >
          <IconDots9 />
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", minWidth: 0 }}>
        <div className="nav-select">
          <button
            type="button"
            className={`sort-btn${filterActive ? " on" : ""}`}
            aria-label="Filter"
            onClick={() => (onFilter ? onFilter() : router.push("/library?filter=1"))}
          >
            <IconSort />
          </button>
          <div className="chip-clip">
            <ChipRow>
              <button role="tab" aria-selected={selected.length === 0} className={`nav-chip${selected.length === 0 ? " active" : ""}`} onClick={onAll}>
                All <span className="count">{fmt(items.length)}</span>
              </button>
              {tags.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button key={t.id} role="tab" aria-selected={on} className={`nav-chip${on ? " active" : ""}`} onClick={() => onChip(t.id)}>
                    {t.name} <span className="count">{fmt(counts.get(t.id) ?? 0)}</span>
                  </button>
                );
              })}
            </ChipRow>
          </div>
        </div>
        {below}
      </div>

      <Drawer open={colorOpen} onClose={() => setColorOpen(false)} label="Color Search">
        <SubClose>
          {(close) => (
            <ColorPickerPanel
              colors={[color ?? "#003CA4"]}
              multi={false}
              onCancel={close}
              onSave={([c]) => {
                setColor(c.slice(0, 7).toUpperCase());
                close();
              }}
            />
          )}
        </SubClose>
      </Drawer>
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; sl: number; moved: boolean; id: number } | null>(null);
  const skipClick = useRef(false);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { x: e.clientX, sl: el.scrollLeft, moved: false, id: e.pointerId };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const dx = d.x - e.clientX;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      skipClick.current = true;
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = d.sl + dx;
  };
  const onUp = () => {
    drag.current = null;
    window.setTimeout(() => { skipClick.current = false; }, 0);
  };

  return (
    <div
      ref={ref}
      className="chip-row"
      role="tablist"
      aria-label="Filter by category"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onClickCapture={(e) => {
        if (!skipClick.current) return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
