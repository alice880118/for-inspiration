"use client";
import { useMemo, useState } from "react";
import { deleteKeyword, renameKeyword } from "@/lib/db";
import { useStore } from "@/components/Store";
import { Backdrop, ConfirmModal, Drawer } from "@/components/ui";
import { PageNav } from "@/components/PageNav";
import { SubClose } from "@/components/FormParts";
import { Actions } from "@/components/Panels";
import { IconChevron, IconClose, IconSearch } from "@/components/Icons";
import { useRouter } from "next/navigation";

/** Manage Tags — free-form keywords, derived from inspirations (rename / merge / delete everywhere). */
export default function ManageTags() {
  const router = useRouter();
  const { inspirations, refresh, toast } = useStore();
  const [q, setQ] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const rows = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of inspirations) for (const k of i.keywords) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [inspirations]);
  const shown = q ? rows.filter(([k]) => k.toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <main className="page page-top">
      <Backdrop soft />
      <PageNav
        title="Manage Tags"
        right={
          <button className="icon-btn" aria-label={q === null ? "Search tags" : "Close search"} onClick={() => setQ(q === null ? "" : null)}>
            {q === null ? <IconSearch /> : <IconClose />}
          </button>
        }
      />
      {q !== null && (
        <label className="input search-inline">
          <IconSearch size={18} />
          <input autoFocus placeholder="Search tags" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      )}
      <div role="list" style={{ marginTop: 16, padding: "0 8px" }}>
        {shown.map(([k, n]) => (
          <div key={k} role="listitem" className="cat-row">
            <button onClick={() => setEdit(k)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <span className="name">#{k}</span>
              <span className="cnt">{n}<IconChevron /></span>
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="body13 muted" style={{ lineHeight: 1.6 }}>
            No tags yet. Add free-form tags such as “Tools” or “Dark mode” from the Tags field when adding or editing an inspiration.
          </p>
        )}
      </div>

      <Drawer open={!!edit} onClose={() => setEdit(null)} label="Edit Tag">
        <SubClose>
          {(close) => edit && (
            <RenamePanel
              name={edit}
              existing={rows.map(([k]) => k)}
              onCancel={close}
              onBrowse={() => { close(); router.push(`/library`); }}
              onDelete={() => { setDel(edit); close(); }}
              onSave={async (to) => {
                await renameKeyword(edit, to);
                await refresh();
                toast(rows.some(([k]) => k.toLowerCase() === to.toLowerCase() && k !== edit) ? `Merged into #${to}` : "Tag renamed");
                close();
              }}
            />
          )}
        </SubClose>
      </Drawer>
      {del && (
        <ConfirmModal
          title="Delete Tag?"
          body={`#${del} will be removed from every inspiration. Inspirations themselves are not deleted.`}
          confirm="Delete"
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            await deleteKeyword(del);
            await refresh();
            toast(`Deleted #${del}`);
            setDel(null);
          }}
        />
      )}
    </main>
  );
}

function RenamePanel({
  name, existing, onSave, onCancel, onDelete,
}: { name: string; existing: string[]; onSave: (v: string) => void; onCancel: () => void; onDelete: () => void; onBrowse: () => void }) {
  const [v, setV] = useState(name);
  const merging = existing.some((k) => k !== name && k.toLowerCase() === v.trim().toLowerCase());
  return (
    <div className="drawer-body">
      <h2 className="drawer-title">Edit Tag</h2>
      <div className="field">
        <div className="field-head"><span className="label">Name</span></div>
        <label className="input">
          <span className="sr-only">Tag name</span>
          <input autoFocus value={v} maxLength={30} onChange={(e) => setV(e.target.value)} />
          {v && <button type="button" className="clear-btn" aria-label="Clear" onClick={() => setV("")}><IconClose size={18} /></button>}
        </label>
        {merging && <p style={{ margin: 0, fontSize: 12, color: "var(--main-01)" }}>This will merge into the existing tag “{v.trim()}”.</p>}
      </div>
      <button type="button" className="btn-link" style={{ color: "var(--danger)", alignSelf: "flex-start", marginTop: -12 }} onClick={onDelete}>Delete this tag</button>
      <Actions onCancel={onCancel} disabled={!v.trim() || v.trim() === name} saveLabel={merging ? "Merge" : "Save"} onSave={() => onSave(v.trim())} />
    </div>
  );
}
