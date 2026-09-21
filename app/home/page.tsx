"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { importBackup } from "@/lib/db";
import { filterInspirations } from "@/lib/filter";
import type { Inspiration } from "@/lib/types";
import { useStore } from "@/components/Store";
import { TopMain, type SortKey } from "@/components/TopMain";
import { Backdrop, BottomNav, CardM, CardS } from "@/components/ui";
import { IconImage } from "@/components/Icons";
import { InertialY, InertialScroll } from "@/components/InertialScroll";

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, inspirations, tags, tagById, openAdd, refresh, toast } = useStore();
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const sort: SortKey = "recent";
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!document.documentElement.classList.contains("from-onboarding")) return;
    const t = window.setTimeout(() => document.documentElement.classList.remove("from-onboarding"), 600);
    return () => window.clearTimeout(t);
  }, []);

  // PWA share target: /home?url=… or ?text=… → open the Add drawer prefilled
  useEffect(() => {
    const shared = params.get("url") || params.get("text")?.match(/https?:\/\/\S+/)?.[0];
    if (shared) {
      openAdd(shared);
      router.replace("/home");
    }
  }, [params, openAdd, router]);

  const open = (id: string) => {
    router.push(`/inspiration?id=${id}`);
  };
  const searching = !!query.trim() || !!color;

  const filtered = useMemo(
    () => filterInspirations(inspirations, { query, color, tag: activeTag, sort, tagById }),
    [inspirations, query, color, activeTag, sort, tagById]
  );
  const recent = filtered.slice(0, 10);
  const byName = (a: Inspiration, b: Inspiration) =>
    (a.title || "Untitled").localeCompare(b.title || "Untitled", undefined, { sensitivity: "base", numeric: true });
  const sections = tags
    .filter((t) => !activeTag || t.id === activeTag)
    .map((t) => ({ tag: t, items: filtered.filter((i) => i.tags.includes(t.id)).sort(byName) }))
    .filter((s) => s.items.length > 0);
  const activeTagColor = activeTag ? tagById.get(activeTag)?.displayColor : null;

  return (
    <main className="scroll-page home-page">
      <Backdrop soft />
      {activeTagColor && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: "var(--app-center-x)",
            width: "100%",
            maxWidth: "var(--app-w)",
            transform: "translateX(-50%)",
            zIndex: -1,
            background: `linear-gradient(180deg, ${activeTagColor}88, transparent 65%)`,
            transition: "background .3s",
          }}
        />
      )}
      <TopMain
        fixed
        query={query} setQuery={setQuery} color={color} setColor={setColor} items={inspirations}
        selected={activeTag ? [activeTag] : []}
        onChip={(id) => setActiveTag(activeTag === id ? null : id)}
        onAll={() => setActiveTag(null)}
      />

      {!ready && inspirations.length === 0 ? (
        <InertialY className="home-content" style={{ minHeight: 0 }} />
      ) : inspirations.length === 0 ? (
        <InertialY className="home-content home-empty">
          <div className="empty">
            <div className="icon-box"><IconImage /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p className="h1" style={{ color: "var(--ink)" }}>No inspiration cards yet</p>
              <p className="body13" style={{ color: "var(--body)" }}>
                Paste a URL or choose an image,
                <br />
                and we’ll capture its title, colors, and fonts.
              </p>
            </div>
            <button className="btn-pill" onClick={() => openAdd()}>Add first inspiration</button>
            <button className="btn-link" onClick={() => importRef.current?.click()}>Have a backup? Import JSON</button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                const n = await importBackup(f);
                await refresh();
                toast(`Imported ${n} inspirations`);
              } catch (err) {
                toast((err as Error).message);
              }
            }} />
          </div>
        </InertialY>
      ) : searching ? (
        <InertialY className="page home-content">
          <div className="section">
            <div className="section-head">
              <p className="h1">{color ? "Similar Colors" : `Results for “${query.trim()}”`}</p>
              <span className="view-all">{filtered.length} Inspirations</span>
            </div>
            {filtered.length ? (
              <div className="grid-s">{filtered.map((i) => <CardS key={i.id} item={i} onOpen={() => open(i.id)} />)}</div>
            ) : (
              <div className="empty" style={{ padding: "48px 16px" }}>
                <p className="h2">No matches</p>
                <p className="body13" style={{ color: "var(--body)" }}>Try another keyword or choose another color.</p>
                <button className="btn-pill" onClick={() => { setQuery(""); setColor(null); }}>Clear search</button>
              </div>
            )}
          </div>
        </InertialY>
      ) : (
        <InertialY className="page home-content" style={{ display: "flex", flexDirection: "column" }}>
          {recent.length > 0 && (
            <section className="section">
              <h2 className="h1">Recently Added</h2>
              <InertialScroll className="h-scroll">{recent.map((i) => <CardM key={i.id} item={i} onOpen={() => open(i.id)} />)}</InertialScroll>
            </section>
          )}
          {sections.map(({ tag, items }) => (
            <section key={tag.id} className="section">
              <div className="section-head">
                <h2 className="h1">{tag.name}</h2>
                <button className="view-all" onClick={() => router.push(`/library?tag=${tag.id}`)}>View all</button>
              </div>
              <InertialScroll className="h-scroll s">{items.slice(0, 12).map((i) => <CardS key={i.id} item={i} onOpen={() => open(i.id)} />)}</InertialScroll>
            </section>
          ))}
        </InertialY>
      )}
      <BottomNav />
    </main>
  );
}
