"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { exportBackup, getMeta, importBackup, setMeta } from "@/lib/db";
import { computeNotices, notificationsEnabled, setNotificationsEnabled } from "@/lib/notify";
import { useStore } from "@/components/Store";
import { Backdrop, ConfirmModal, Drawer } from "@/components/ui";
import { PageNav } from "@/components/PageNav";
import { SubClose } from "@/components/FormParts";
import { IconBell, IconChevron } from "@/components/Icons";

/** 06 Settings (Figma 255:988) */
export default function Settings() {
  const { inspirations, tags, tagById, refresh, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState("");
  const [notify, setNotify] = useState(false);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [confirmReplace, setConfirmReplace] = useState<File | null>(null);
  const [installEvt, setInstallEvt] = useState<(Event & { prompt?: () => void }) | null>(null);

  const imageCount = inspirations.filter((i) => i.imageId).length;
  const notices = computeNotices(inspirations, tagById);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage(`${((e.usage ?? 0) / 1048576).toFixed(0)} MB`));
    notificationsEnabled().then(setNotify);
    getMeta<number | null>("lastBackupAt", null).then(setLastBackup);
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const doExport = async (withImages: boolean) => {
    const blob = await exportBackup(withImages);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pobbi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    const now = Date.now();
    await setMeta("lastBackupAt", now);
    setLastBackup(now);
    toast("Backup downloaded");
  };

  const runImport = async (f: File, mode: "merge" | "replace") => {
    try {
      const n = await importBackup(f, mode);
      await refresh();
      toast(`${mode === "replace" ? "Replaced with" : "Imported"} ${n} inspirations`);
    } catch (err) {
      toast((err as Error).message);
    }
  };

  const Row = ({ label, value, href, onClick }: { label: string; value?: string; href?: string; onClick?: () => void }) => {
    const inner = (
      <>
        {label}
        <span className="val">{value}<IconChevron /></span>
      </>
    );
    return href ? <Link className="set-row" href={href}>{inner}</Link> : <button className="set-row" onClick={onClick}>{inner}</button>;
  };

  return (
    <main className="page page-top">
      <Backdrop soft />
      <PageNav
        title="Settings"
        backTo="/home"
        right={
          <Link href="/notifications" className="icon-btn" aria-label={`Notifications${notices.length ? ` (${notices.length})` : ""}`} style={{ position: "relative" }}>
            <IconBell />
            {notices.length > 0 && <span className="bell-dot" />}
          </Link>
        }
      />

      <h2 className="set-group">Content</h2>
      <Row label="Manage Categories" value={`${tags.length} categories`} href="/settings/categories" />

      <h2 className="set-group" style={{ marginTop: 24 }}>Data</h2>
      <Row label="Export JSON backup" value="Include images" onClick={() => setExportOpen(true)} />
      <Row label="Import backup" value="Merge / Replace" onClick={() => setImportOpen(true)} />
      <div className="set-row">
        Notifications reminder
        <button
          role="switch"
          aria-checked={notify}
          aria-label="Notifications reminder"
          className="toggle"
          onClick={async () => {
            const on = await setNotificationsEnabled(!notify);
            setNotify(on);
            if (on && "Notification" in window && Notification.permission !== "granted") {
              toast("Reminders will show inside Pobbi (system notifications are blocked)");
            }
          }}
        />
      </div>
      <Row
        label="Storage"
        value={`${usage || "—"} · ${imageCount} images`}
        onClick={async () => {
          const ok = await navigator.storage?.persist?.().catch(() => false);
          toast(ok ? "Storage is protected on this device" : "Storage protection not granted by the browser — export backups regularly");
        }}
      />
      {installEvt?.prompt && <Row label="Install Pobbi on this device" onClick={() => installEvt.prompt!()} />}
      <p style={{ fontSize: 11, color: "#b0b0b0", margin: "16px 0 0" }}>
        Last backup: {lastBackup ? new Date(lastBackup).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }) : "never"}
      </p>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (importMode === "replace") setConfirmReplace(f);
        else runImport(f, "merge");
      }} />

      <Drawer open={exportOpen} onClose={() => setExportOpen(false)} label="Export JSON backup">
        <SubClose>
          {(close) => (
            <div className="drawer-body">
              <h2 className="drawer-title">Export JSON backup</h2>
              <div>
                <button className="set-row" onClick={() => { doExport(true); close(); }}>
                  Include images<span className="val">Full backup · {imageCount} images<IconChevron /></span>
                </button>
                <button className="set-row" onClick={() => { doExport(false); close(); }}>
                  Data only<span className="val">Smaller file<IconChevron /></span>
                </button>
              </div>
            </div>
          )}
        </SubClose>
      </Drawer>
      <Drawer open={importOpen} onClose={() => setImportOpen(false)} label="Import backup">
        <SubClose>
          {(close) => (
            <div className="drawer-body">
              <h2 className="drawer-title">Import backup</h2>
              <div>
                <button className="set-row" onClick={() => { setImportMode("merge"); close(); setTimeout(() => fileRef.current?.click(), 250); }}>
                  Merge<span className="val">Add to current library<IconChevron /></span>
                </button>
                <button className="set-row" onClick={() => { setImportMode("replace"); close(); setTimeout(() => fileRef.current?.click(), 250); }}>
                  Replace<span className="val" style={{ color: "var(--danger)" }}>Clear library first<IconChevron /></span>
                </button>
              </div>
            </div>
          )}
        </SubClose>
      </Drawer>
      {confirmReplace && (
        <ConfirmModal
          title="Replace your library?"
          body={`All ${inspirations.length} inspirations on this device will be removed and replaced by the backup. Export a backup first if you’re unsure.`}
          confirm="Replace"
          onCancel={() => setConfirmReplace(null)}
          onConfirm={() => { runImport(confirmReplace, "replace"); setConfirmReplace(null); }}
        />
      )}
    </main>
  );
}
