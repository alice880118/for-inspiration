"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Inspiration, Tag } from "@/lib/types";
import { normalizeUrl } from "@/lib/image";
import { useStore } from "./Store";
import {
  IconArrowUpRight, IconCalendarAdd, IconCalendarFilled, IconColorAdd, IconHome, IconImage, IconLibrary, IconMore, IconPlus,
} from "./Icons";

export function Backdrop({ soft = false }: { soft?: boolean }) {
  return (
    <div className={`backdrop${soft ? " soft" : ""}`} aria-hidden>
      <i /><i /><i /><i /><i />
    </div>
  );
}

export function BottomNav() {
  const path = usePathname();
  const router = useRouter();
  const { openAdd } = useStore();

  useEffect(() => {
    router.prefetch("/home");
    router.prefetch("/library");
    router.prefetch("/reading");
    router.prefetch("/reading/history");
  }, [router]);

  return (
    <>
      <div className="bottom-fade" aria-hidden />
      <nav className="bottom-nav" aria-label="Primary">
        <div className="nav-pill">
          <Link href="/home" prefetch className="nav-ico" aria-label="Home" aria-current={path === "/home" ? "page" : undefined}>
            <IconHome active={path === "/home"} />
          </Link>
          <Link href="/library" prefetch className="nav-ico" aria-label="Library" aria-current={path === "/library" ? "page" : undefined}>
            <IconLibrary active={path === "/library"} />
          </Link>
          <Link
            href="/reading"
            prefetch
            className="nav-ico"
            aria-label="Reading queue"
            aria-current={path.startsWith("/reading") ? "page" : undefined}
          >
            {path.startsWith("/reading") ? <IconCalendarFilled /> : <IconCalendarAdd />}
          </Link>
        </div>
        <button className="fab" aria-label="Add inspiration" onClick={() => openAdd()}>
          <IconPlus />
        </button>
      </nav>
    </>
  );
}

/** Bottom sheet with drag-to-dismiss on the handle. */
export function Drawer({
  open, onClose, children, label, sub = false,
}: { open: boolean; onClose: () => void; children: ReactNode; label: string; sub?: boolean }) {
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 310);
  };

  useEffect(() => {
    if (!open) return;
    const depth = ++drawerDepth;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && depth === drawerDepth && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const sheet = ref.current;
    const vv = window.visualViewport;
    const pinToKeyboard = () => {
      if (!sheet || drag.current) return;
      const inset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      sheet.style.bottom = `${inset}px`;
      sheet.style.maxHeight = `${Math.max(240, (vv?.height ?? window.innerHeight) - 8)}px`;
    };
    const revealField = () => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement) || !sheet?.contains(el)) return;
      if (!el.matches("input, textarea, select, [contenteditable='true']")) return;
      window.setTimeout(() => {
        el.scrollIntoView({ block: "center", inline: "nearest" });
      }, 50);
    };
    pinToKeyboard();
    vv?.addEventListener("resize", pinToKeyboard);
    vv?.addEventListener("scroll", pinToKeyboard);
    window.addEventListener("focusin", revealField);
    sheet?.addEventListener("focusin", revealField);

    return () => {
      drawerDepth--;
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      vv?.removeEventListener("resize", pinToKeyboard);
      vv?.removeEventListener("scroll", pinToKeyboard);
      window.removeEventListener("focusin", revealField);
      sheet?.removeEventListener("focusin", revealField);
      if (sheet) {
        sheet.style.bottom = "";
        sheet.style.maxHeight = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className={`scrim${sub ? " sub" : ""}${closing ? " closing" : ""}`} onClick={close} />
      <div
        ref={ref}
        className={`drawer${sub ? " sub" : ""}${closing ? " closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div
          className="handle"
          onPointerDown={(e) => {
            drag.current = { y: e.clientY, dy: 0 };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current || !ref.current) return;
            drag.current.dy = Math.max(0, e.clientY - drag.current.y);
            ref.current.style.transform = `translate(-50%, ${drag.current.dy}px)`;
          }}
          onPointerUp={() => {
            if (!drag.current || !ref.current) return;
            const { dy } = drag.current;
            drag.current = null;
            ref.current.style.transform = "";
            if (dy > 90) close();
          }}
        >
          <i />
        </div>
        <DrawerCloseCtx.Provider value={close}>{children}</DrawerCloseCtx.Provider>
      </div>
    </>,
    document.body
  );
}
let drawerDepth = 0;
const DrawerCloseCtx = createContext<() => void>(() => {});
export const useDrawerClose = () => useContext(DrawerCloseCtx);

export function Palette({
  colors, size = "m", onPick, onAdd, onRemove, editing = false,
}: {
  colors: string[];
  size?: "m" | "s";
  onPick?: (index: number) => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  editing?: boolean;
}) {
  const editable = !!(onPick || onAdd);
  return (
    <div className={`palette ${size}${editable ? " editable" : ""}`}>
      {colors.map((c, i) =>
        editable ? (
          <button
            key={i}
            type="button"
            className="sw"
            style={{ background: c }}
            aria-label={editing ? `Remove color ${c}` : `Edit color ${c}`}
            onClick={() => (editing ? onRemove?.(i) : onPick?.(i))}
          >
            {editing && <span className="rm">×</span>}
          </button>
        ) : (
          <span key={i} className="sw" style={{ background: c }} title={c} />
        )
      )}
      {onAdd && colors.length < 8 && (
        <button type="button" className="add" onClick={onAdd} aria-label="Add color">
          <IconColorAdd size={20} />
        </button>
      )}
    </div>
  );
}

export function TagPill({
  tag, on, onClick, editing,
}: { tag: Tag; on: boolean; onClick: () => void; editing?: boolean }) {
  return (
    <button type="button" className={`tag${on ? " on" : ""}${editing ? " editing" : ""}`} aria-pressed={on} onClick={onClick}>
      <span className="dot" style={{ background: tag.displayColor }} />
      {tag.name}
    </button>
  );
}

function openSource(e: React.MouseEvent, url: string) {
  e.stopPropagation();
  e.preventDefault();
  if (url) window.open(normalizeUrl(url), "_blank", "noopener,noreferrer");
}

export function CardM({ item, onOpen }: { item: Inspiration; onOpen: () => void }) {
  const { imageUrl, tagById } = useStore();
  const src = imageUrl(item.imageId);
  const tagNames = item.tags.map((t) => tagById.get(t)?.name).filter(Boolean) as string[];
  return (
    <div className="card-m" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <div className="card-media">
        {src ? <img src={src} alt="" loading="lazy" /> : <div className="ph"><IconImage /></div>}
        {item.sourceUrl && (
          <button className="open" aria-label="Open original link" onClick={(e) => openSource(e, item.sourceUrl)}>
            <IconArrowUpRight />
          </button>
        )}
      </div>
      <div className="card-meta">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <div className="card-title">{item.title || "Untitled"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {tagNames.slice(0, 2).map((n) => (
              <span key={n} className="card-tag">{n}</span>
            ))}
            {tagNames.length > 2 && (
              <span className="card-tag" title={tagNames.slice(2).join(", ")} style={{ padding: 0 }}>
                <IconMore size={24} />
              </span>
            )}
          </div>
        </div>
        <Palette colors={item.palette.slice(0, 5)} />
      </div>
    </div>
  );
}

export function CardS({ item, onOpen }: { item: Inspiration; onOpen: () => void }) {
  const { imageUrl } = useStore();
  const src = imageUrl(item.imageId);
  return (
    <div className="card-s" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <div className="card-media">
        {src ? <img src={src} alt="" loading="lazy" /> : <div className="ph"><IconImage size={24} /></div>}
        {item.sourceUrl && (
          <button className="open" aria-label="Open original link" onClick={(e) => openSource(e, item.sourceUrl)}>
            <IconArrowUpRight size={22} />
          </button>
        )}
        <Palette colors={item.palette.slice(0, 5)} size="s" />
      </div>
      <div className="card-title">{item.title || "Untitled"}</div>
    </div>
  );
}

export function ConfirmModal({
  title, body, confirm, onConfirm, onCancel,
}: { title: string; body: string; confirm: string; onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <div className="modal" role="alertdialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="actions">
          <button className="btn-m line" onClick={onCancel}>Cancel</button>
          <button className="btn-m danger" onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PromptModal({
  title, initial = "", placeholder, confirm = "Save", onConfirm, onCancel, extra,
}: {
  title: string; initial?: string; placeholder?: string; confirm?: string;
  onConfirm: (value: string) => void; onCancel: () => void; extra?: ReactNode;
}) {
  const [v, setV] = useState(initial);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (v.trim()) onConfirm(v.trim());
        }}
      >
        <h3>{title}</h3>
        <div className="input" style={{ background: "#f3f5f8" }}>
          <input autoFocus value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} maxLength={40} />
        </div>
        {extra}
        <div className="actions">
          <button type="button" className="btn-m line" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-m fill" disabled={!v.trim()}>{confirm}</button>
        </div>
      </form>
    </div>
  );
}
