import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type Category,
  type CollectionData,
  DEFAULT_CATEGORIES,
  type InspirationLink,
  loadCollection,
  saveCollection,
} from "./storage";

const palette = [
  "#6c5ce7",
  "#e17055",
  "#00a884",
  "#d65b83",
  "#3877c9",
  "#b7791f",
  "#16859b",
];

const colors = {
  page: "#f6f5f1",
  panel: "#ffffff",
  ink: "#191919",
  muted: "#6f6f6f",
  faint: "#989898",
  line: "#deddd8",
  soft: "#efeee9",
  accent: "#191919",
  danger: "#b42318",
};

const buttonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  border: `1px solid ${colors.line}`,
  borderRadius: 8,
  background: colors.panel,
  color: colors.ink,
  font: "inherit",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  borderColor: colors.accent,
  background: colors.accent,
  color: "#ffffff",
};

const iconButtonStyle: CSSProperties = {
  ...buttonStyle,
  width: 38,
  padding: 0,
  display: "grid",
  placeItems: "center",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  boxSizing: "border-box",
  border: `1px solid ${colors.line}`,
  borderRadius: 8,
  padding: "9px 11px",
  background: colors.panel,
  color: colors.ink,
  font: "inherit",
  fontSize: 15,
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: colors.muted,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.03em",
};

function newId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function guessTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const segment = decodeURIComponent(parsed.pathname)
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/\.(html?|php)$/i, "")
      .replace(/[-_+]/g, " ")
      .trim();
    return segment && segment.length > 2
      ? segment.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 80)
      : parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function initial(title: string): string {
  return title.trim().charAt(0).toUpperCase() || "?";
}

function cloneDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}

function SvgIcon({
  path,
  size = 18,
}: {
  path: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

function BaseDialog({
  open,
  onOpenChange,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgb(0 0 0 / 42%)",
          }}
        />
        <Dialog.Popup
          style={{
            position: "fixed",
            zIndex: 101,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: wide ? "min(680px, calc(100vw - 24px))" : "min(520px, calc(100vw - 24px))",
            maxHeight: "min(760px, calc(100dvh - 24px))",
            overflowY: "auto",
            boxSizing: "border-box",
            border: `1px solid ${colors.line}`,
            borderRadius: 14,
            padding: 20,
            background: colors.panel,
            color: colors.ink,
            boxShadow: "0 24px 80px rgb(0 0 0 / 20%)",
            outline: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <Dialog.Title style={{ margin: 0, fontSize: 20, fontWeight: 650 }}>
              {title}
            </Dialog.Title>
            <Dialog.Close style={iconButtonStyle} aria-label="關閉">
              <SvgIcon path="M6 6l12 12M18 6 6 18" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CategoryChecks({
  categories,
  selected,
  onChange,
}: {
  categories: Category[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {categories.map((category) => {
        const checked = selected.includes(category.id);
        return (
          <label
            key={category.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              minHeight: 36,
              padding: "0 11px",
              border: `1px solid ${checked ? category.color : colors.line}`,
              borderRadius: 999,
              background: checked ? `${category.color}16` : colors.panel,
              fontSize: 13,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <Checkbox.Root
              checked={checked}
              onCheckedChange={(next) => {
                const ids = next
                  ? [...selected, category.id]
                  : selected.filter((id) => id !== category.id);
                onChange(ids.length > 0 ? ids : ["others"]);
              }}
              style={{
                width: 16,
                height: 16,
                display: "grid",
                placeItems: "center",
                padding: 0,
                border: `1px solid ${checked ? category.color : colors.faint}`,
                borderRadius: 4,
                background: checked ? category.color : colors.panel,
                color: "#ffffff",
              }}
            >
              <Checkbox.Indicator>
                <SvgIcon path="m4 12 5 5L20 6" size={13} />
              </Checkbox.Indicator>
            </Checkbox.Root>
            {category.name}
          </label>
        );
      })}
    </div>
  );
}

async function imageToDataUrl(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });

  const scale = Math.min(1, 720 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.76);
}

function LinkDialog({
  open,
  link,
  categories,
  initialUrl,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  link: InspirationLink | null;
  categories: Category[];
  initialUrl: string;
  onClose: () => void;
  onSave: (link: InspirationLink) => void;
  onDelete: (id: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>(["others"]);
  const [tags, setTags] = useState("");
  const [thumb, setThumb] = useState("");

  useEffect(() => {
    const normalized = normalizeUrl(initialUrl);
    setUrl(link?.url ?? normalized);
    setTitle(link?.title ?? (normalized ? guessTitle(normalized) : ""));
    setSelected(link?.cats?.length ? link.cats : ["others"]);
    setTags(link?.tags?.join(", ") ?? "");
    setThumb(link?.thumb ?? "");
  }, [initialUrl, link, open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      return;
    }

    onSave({
      id: link?.id ?? newId(),
      url: normalized,
      title: title.trim() || guessTitle(normalized),
      cats: selected,
      tags: tags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean),
      thumb,
      createdAt: link?.createdAt ?? Date.now(),
      order: link?.order ?? Date.now(),
      needsReview: false,
    });
  }

  async function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setThumb(await imageToDataUrl(file));
    }
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={link ? "編輯靈感" : "新增靈感"}
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="link-url" style={labelStyle}>
            網址
          </label>
          <input
            id="link-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            inputMode="url"
            autoFocus
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="link-title" style={labelStyle}>
            名稱
          </label>
          <input
            id="link-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="留空會從網址自動命名"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>分類</span>
          <CategoryChecks
            categories={categories}
            selected={selected}
            onChange={setSelected}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="link-tags" style={labelStyle}>
            標籤（用逗號分隔）
          </label>
          <input
            id="link-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="reference, typography, mobile"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>縮圖（選用）</span>
          {thumb ? (
            <img
              src={thumb}
              alt=""
              style={{
                display: "block",
                width: "100%",
                maxHeight: 220,
                objectFit: "cover",
                borderRadius: 10,
                marginBottom: 8,
              }}
            />
          ) : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ ...buttonStyle, display: "grid", placeItems: "center" }}>
              選擇圖片
              <input
                type="file"
                accept="image/*"
                onChange={pickImage}
                style={{ display: "none" }}
              />
            </label>
            {thumb ? (
              <Button type="button" style={buttonStyle} onClick={() => setThumb("")}>
                移除縮圖
              </Button>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 22,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {link ? (
              <>
                <Button
                  type="button"
                  style={{ ...buttonStyle, color: colors.danger }}
                  onClick={() => onDelete(link.id)}
                >
                  刪除
                </Button>
                <Button
                  type="button"
                  style={buttonStyle}
                  onClick={() =>
                    window.open(link.url, "_blank", "noopener,noreferrer")
                  }
                >
                  開啟
                </Button>
              </>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="button" style={buttonStyle} onClick={onClose}>
              取消
            </Button>
            <Button type="submit" style={primaryButtonStyle}>
              儲存
            </Button>
          </div>
        </div>
      </form>
    </BaseDialog>
  );
}

function CategoryDialog({
  open,
  categories,
  links,
  onClose,
  onCommit,
}: {
  open: boolean;
  categories: Category[];
  links: InspirationLink[];
  onClose: () => void;
  onCommit: (categories: Category[], links: InspirationLink[]) => void;
}) {
  const [draft, setDraft] = useState<Category[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setDraft(categories.map((category) => ({ ...category })));
  }, [categories, open]);

  function remove(category: Category) {
    const nextCategories = draft.filter((item) => item.id !== category.id);
    const nextLinks = links.map((link) => {
      if (!link.cats.includes(category.id)) {
        return link;
      }
      const cats = link.cats.filter((id) => id !== category.id);
      return {
        ...link,
        cats: cats.length ? cats : ["others"],
        needsReview: cats.length === 0,
      };
    });
    setDraft(nextCategories);
    onCommit(nextCategories, nextLinks);
  }

  function saveAndClose() {
    onCommit(draft, links);
    onClose();
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="管理分類"
    >
      <div style={{ display: "grid", gap: 8 }}>
        {draft.map((category, index) => (
          <div
            key={category.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Button
              type="button"
              aria-label="更換分類顏色"
              style={{
                width: 24,
                height: 24,
                padding: 0,
                border: 0,
                borderRadius: 7,
                background: category.color,
                cursor: "pointer",
              }}
              onClick={() =>
                setDraft((current) =>
                  current.map((item) =>
                    item.id === category.id
                      ? {
                          ...item,
                          color:
                            palette[
                              (palette.indexOf(item.color) + 1) % palette.length
                            ],
                        }
                      : item,
                  ),
                )
              }
            />
            <input
              value={category.name}
              readOnly={category.locked}
              onChange={(event) =>
                setDraft((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
              style={inputStyle}
            />
            {category.locked ? (
              <span style={{ color: colors.faint, fontSize: 12 }}>系統</span>
            ) : (
              <Button
                type="button"
                aria-label={`刪除 ${category.name}`}
                style={{ ...iconButtonStyle, color: colors.danger }}
                onClick={() => remove(category)}
              >
                <SvgIcon path="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="新增分類"
          style={inputStyle}
        />
        <Button
          type="button"
          style={buttonStyle}
          onClick={() => {
            const trimmed = name.trim();
            if (!trimmed) {
              return;
            }
            const othersIndex = Math.max(0, draft.length - 1);
            const next = [...draft];
            next.splice(othersIndex, 0, {
              id: newId(),
              name: trimmed,
              color: palette[draft.length % palette.length],
            });
            setDraft(next);
            setName("");
          }}
        >
          新增
        </Button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button type="button" style={primaryButtonStyle} onClick={saveAndClose}>
          完成
        </Button>
      </div>
    </BaseDialog>
  );
}

function DataDialog({
  open,
  data,
  onClose,
  onImport,
}: {
  open: boolean;
  data: CollectionData;
  onClose: () => void;
  onImport: (data: CollectionData) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "inspiration-collector.json";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as CollectionData;
        if (!Array.isArray(parsed.links)) {
          throw new Error("Invalid collection");
        }
        onImport({
          links: parsed.links,
          cats:
            Array.isArray(parsed.cats) && parsed.cats.length
              ? parsed.cats
              : cloneDefaultCategories(),
        });
        onClose();
      } catch {
        window.alert("這個 JSON 備份檔格式不正確。");
      }
    };
    reader.readAsText(file);
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="資料與備份"
    >
      <div
        style={{
          border: `1px solid ${colors.line}`,
          borderRadius: 10,
          padding: 14,
          background: colors.soft,
        }}
      >
        <div style={{ fontWeight: 650, marginBottom: 4 }}>已持續儲存在這台裝置</div>
        <div style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
          每次新增、編輯或刪除都會立即寫入 IndexedDB，並同步保留一份
          localStorage 備援。重新整理、關閉 Safari 或從主畫面重開都不會清空。
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        <div style={{ border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: colors.muted, fontSize: 12 }}>靈感</div>
          <div style={{ fontSize: 24, fontWeight: 650 }}>{data.links.length}</div>
        </div>
        <div style={{ border: `1px solid ${colors.line}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: colors.muted, fontSize: 12 }}>分類</div>
          <div style={{ fontSize: 24, fontWeight: 650 }}>{data.cats.length}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        <Button type="button" style={buttonStyle} onClick={download}>
          下載 JSON 備份
        </Button>
        <Button
          type="button"
          style={buttonStyle}
          onClick={() => inputRef.current?.click()}
        >
          匯入 JSON 備份
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={importFile}
          style={{ display: "none" }}
        />
      </div>
      <p style={{ margin: "14px 0 0", color: colors.faint, fontSize: 12 }}>
        只有手動清除網站資料時才會刪除本機收藏，建議定期下載 JSON 備份。
      </p>
    </BaseDialog>
  );
}

export function InspirationCollector() {
  const [data, setData] = useState<CollectionData>({
    links: [],
    cats: cloneDefaultCategories(),
  });
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("讀取中…");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<InspirationLink | null>(null);
  const [prefillUrl, setPrefillUrl] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    loadCollection().then((stored) => {
      if (active) {
        setData(stored);
        setReady(true);
        setStatus("已儲存");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener(
        "load",
        () => {
          navigator.serviceWorker
            .register("/for-inspiration/sw.js")
            .catch(() => undefined);
        },
        { once: true },
      );
    }
  }, []);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const text = event.clipboardData?.getData("text").trim() ?? "";
      if (/^(https?:\/\/|www\.)/i.test(text)) {
        setEditingLink(null);
        setPrefillUrl(text);
        setLinkDialogOpen(true);
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function commit(next: CollectionData) {
    setData(next);
    setStatus("儲存中…");
    saveCollection(next)
      .then(() => setStatus("已儲存"))
      .catch(() => setStatus("儲存失敗"));
  }

  const visibleLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.links
      .filter((link) => !categoryId || link.cats.includes(categoryId))
      .filter(
        (link) =>
          !normalizedQuery ||
          link.title.toLowerCase().includes(normalizedQuery) ||
          link.url.toLowerCase().includes(normalizedQuery) ||
          link.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [categoryId, data.links, query]);

  function openNewLink(url = "") {
    setEditingLink(null);
    setPrefillUrl(url);
    setLinkDialogOpen(true);
  }

  function saveLink(link: InspirationLink) {
    const exists = data.links.some((item) => item.id === link.id);
    const links = exists
      ? data.links.map((item) => (item.id === link.id ? link : item))
      : [link, ...data.links];
    commit({ ...data, links });
    setLinkDialogOpen(false);
  }

  function deleteLink(id: string) {
    if (!window.confirm("確定刪除這筆靈感？")) {
      return;
    }
    commit({ ...data, links: data.links.filter((link) => link.id !== id) });
    setLinkDialogOpen(false);
  }

  if (!ready) {
    return (
      <main
        style={{
          minHeight: "calc(100dvh - 48px)",
          display: "grid",
          placeItems: "center",
          color: colors.muted,
        }}
      >
        正在讀取收藏…
      </main>
    );
  }

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          height: 48,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${colors.line}`,
          background: "rgb(246 245 241 / 94%)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            width: "min(1120px, calc(100% - 28px))",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Button
            style={{
              border: 0,
              padding: 0,
              background: "transparent",
              color: colors.ink,
              font: "inherit",
              fontWeight: 720,
              fontSize: 16,
              cursor: "pointer",
            }}
            onClick={() => {
              setCategoryId(null);
              setQuery("");
            }}
          >
            Inspiration
          </Button>
          <span style={{ color: colors.faint, fontSize: 11 }}>{status}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <Button
              style={iconButtonStyle}
              aria-label="管理分類"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <SvgIcon path="M4 7h16M4 12h16M4 17h10" />
            </Button>
            <Button
              style={iconButtonStyle}
              aria-label="資料與備份"
              onClick={() => setDataDialogOpen(true)}
            >
              <SvgIcon path="M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3Zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6m-16 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
            </Button>
          </div>
        </div>
      </header>

      <main
        style={{
          minHeight: "calc(100dvh - 48px)",
          width: "min(1120px, calc(100% - 28px))",
          margin: "0 auto",
          padding: "24px 0 96px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 5px",
                color: colors.muted,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Personal reference library
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(28px, 6vw, 46px)", lineHeight: 1.08 }}>
              收集讓你停下來的東西
            </h1>
          </div>
          <Button style={primaryButtonStyle} onClick={() => openNewLink()}>
            ＋ 新增網址
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 10,
            marginTop: 24,
          }}
        >
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.faint,
                pointerEvents: "none",
              }}
            >
              <SvgIcon path="m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋名稱、標籤或網址"
              aria-label="搜尋"
              style={{ ...inputStyle, paddingLeft: 42, minHeight: 46 }}
            />
          </div>
          <Button style={buttonStyle} onClick={() => setCategoryId(null)}>
            全部 {data.links.length}
          </Button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "14px 0 4px",
          }}
        >
          {data.cats.map((category) => {
            const active = categoryId === category.id;
            const count = data.links.filter((link) =>
              link.cats.includes(category.id),
            ).length;
            return (
              <Button
                key={category.id}
                style={{
                  ...buttonStyle,
                  flex: "0 0 auto",
                  minHeight: 34,
                  borderColor: active ? category.color : colors.line,
                  background: active ? `${category.color}18` : colors.panel,
                }}
                onClick={() =>
                  setCategoryId((current) =>
                    current === category.id ? null : category.id,
                  )
                }
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    marginRight: 7,
                    borderRadius: 99,
                    background: category.color,
                  }}
                />
                {category.name} {count}
              </Button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 26,
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>
            {categoryId
              ? data.cats.find((category) => category.id === categoryId)?.name
              : query
                ? "搜尋結果"
                : "最近收藏"}
          </h2>
          <span style={{ color: colors.faint, fontSize: 12 }}>
            {visibleLinks.length} 筆
          </span>
        </div>

        {visibleLinks.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
              gap: 12,
            }}
          >
            {visibleLinks.map((link) => (
              <Button
                key={link.id}
                style={{
                  minWidth: 0,
                  padding: 0,
                  overflow: "hidden",
                  border: `1px solid ${colors.line}`,
                  borderRadius: 12,
                  background: colors.panel,
                  color: colors.ink,
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setEditingLink(link);
                  setPrefillUrl("");
                  setLinkDialogOpen(true);
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "16 / 10",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    background: colors.soft,
                    color: colors.faint,
                    fontSize: 36,
                    fontWeight: 700,
                  }}
                >
                  {initial(link.title)}
                  {link.thumb ? (
                    <img
                      src={link.thumb}
                      alt=""
                      loading="lazy"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>
                <div style={{ padding: 13 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 14,
                      fontWeight: 650,
                    }}
                  >
                    {link.title}
                  </div>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 4,
                      color: colors.muted,
                      fontSize: 12,
                    }}
                  >
                    {host(link.url)}
                  </div>
                  {link.tags.length ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        overflow: "hidden",
                        marginTop: 10,
                      }}
                    >
                      {link.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            flex: "0 0 auto",
                            padding: "3px 7px",
                            borderRadius: 5,
                            background: colors.soft,
                            color: colors.muted,
                            fontSize: 10,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              minHeight: 260,
              border: `1px dashed ${colors.line}`,
              borderRadius: 14,
              background: colors.panel,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 650 }}>
                {data.links.length ? "找不到符合的靈感" : "收藏第一個靈感"}
              </div>
              <p style={{ margin: "6px 0 16px", color: colors.muted, fontSize: 13 }}>
                貼上網址，或點擊新增網址。
              </p>
              <Button style={primaryButtonStyle} onClick={() => openNewLink()}>
                新增網址
              </Button>
            </div>
          </div>
        )}
      </main>

      <Button
        style={{
          ...primaryButtonStyle,
          position: "fixed",
          zIndex: 30,
          right: 18,
          bottom: "calc(18px + env(safe-area-inset-bottom))",
          minHeight: 48,
          padding: "0 18px",
          borderRadius: 999,
          boxShadow: "0 12px 30px rgb(0 0 0 / 20%)",
        }}
        onClick={() => openNewLink()}
      >
        ＋ 貼上網址
      </Button>

      <LinkDialog
        open={linkDialogOpen}
        link={editingLink}
        categories={data.cats}
        initialUrl={prefillUrl}
        onClose={() => setLinkDialogOpen(false)}
        onSave={saveLink}
        onDelete={deleteLink}
      />
      <CategoryDialog
        open={categoryDialogOpen}
        categories={data.cats}
        links={data.links}
        onClose={() => setCategoryDialogOpen(false)}
        onCommit={(cats, links) => commit({ ...data, cats, links })}
      />
      <DataDialog
        open={dataDialogOpen}
        data={data}
        onClose={() => setDataDialogOpen(false)}
        onImport={commit}
      />
    </>
  );
}
