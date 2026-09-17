"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { importBackup } from "@/lib/db";
import { filterInspirations } from "@/lib/filter";
import { useStore } from "@/components/Store";
import { TopMain, type SortKey } from "@/components/TopMain";
import { Backdrop, BottomNav, CardM, CardS } from "@/components/ui";
import { IconImage } from "@/components/Icons";

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

  // PWA share target: /home?url=… or ?text=… → open the Add drawer prefilled
  useEffect(() => {
    const shared = params.get("url") || params.get("text")?.match(/https?:\/\/\S+/)?.[0];
    if (shared) {
      openAdd(shared);
      router.replace("/home");
    }
  }, [params, openAdd, router]);

  const open = (id: string) => {
    router.prefetch(`/inspiration?id=${id}`);
    router.push(`/inspiration?id=${id}`);
  };
  const searching = !!query.trim() || !!color;

  const filtered = useMemo(
    () => filterInspirations(inspirations, { query, color, tag: activeTag, sort, tagById }),
    [inspirations, query, color, activeTag, sort, tagById]
  );
  const recent = filtered.slice(0, 10);
  const sections = tags
    .filter((t) => !activeTag || t.id === activeTag)
    .map((t) => ({ tag: t, items: filtered.filter((i) => i.tags.includes(t.id)) }))
    .filter((s) => s.items.length > 0);
  const activeTagColor = activeTag ? tagById.get(activeTag)?.displayColor : null;

  return (
    <main>
      <Backdrop soft />
      {activeTagColor && (
        <div aria-hidden style={{ position: "fixed", inset: 0, maxWidth: "var(--app-w)", margin: "0 auto", zIndex: -1, background: `linear-gradient(180deg, ${activeTagColor}88, transparent 65%)`, transition: "background .3s" }} />
      )}
      <TopMain
        query={query} setQuery={setQuery} color={color} setColor={setColor} items={inspirations}
        selected={activeTag ? [activeTag] : []}
        onChip={(id) => setActiveTag(activeTag === id ? null : id)}
        onAll={() => setActiveTag(null)}
      />

      {!ready ? null : inspirations.length === 0 ? (
        <div style={{ minHeight: "calc(100dvh - 260px)", display: "grid", placeItems: "center" }}>
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
        </div>
      ) : searching ? (
        <div className="page" style={{ paddingTop: 8 }}>
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
        </div>
      ) : (
        <div className="page" style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 32 }}>
          {recent.length > 0 ? (
            <section className="section">
              <h2 className="h1">Recently Added</h2>
              <div className="h-scroll" key={recent[0]?.id}>{recent.map((i) => <CardM key={i.id} item={i} onOpen={() => open(i.id)} />)}</div>
            </section>
          ) : (
            <div className="empty" style={{ padding: "48px 16px" }}>
              <p className="h2">Nothing in this tag yet</p>
              <button className="btn-pill" onClick={() => openAdd()}>Add inspiration</button>
            </div>
          )}
          {sections.map(({ tag, items }) => (
            <section key={tag.id} className="section">
              <div className="section-head">
                <h2 className="h1">{tag.name}</h2>
                <button className="view-all" onClick={() => router.push(`/library?tag=${tag.id}`)}>View all</button>
              </div>
              <div className="h-scroll s">{items.slice(0, 12).map((i) => <CardS key={i.id} item={i} onOpen={() => open(i.id)} />)}</div>
            </section>
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
