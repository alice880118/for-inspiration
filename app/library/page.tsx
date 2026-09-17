"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { filterInspirations } from "@/lib/filter";
import { useStore } from "@/components/Store";
import { TopMain } from "@/components/TopMain";
import { Backdrop, BottomNav, Drawer } from "@/components/ui";
import { FlatItem } from "@/components/FlatItem";
import { SubClose } from "@/components/FormParts";
import { Actions } from "@/components/Panels";
import { DatePickerPanel, buildMarks } from "@/components/Calendar";
import { IconCalendarAdd, IconCheckbox, IconClose } from "@/components/Icons";

export default function LibraryPage() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}

interface Filters {
  tags: string[];
  caseStudy: boolean;
  onDate: number | null;
}

/** 02 Library (Figma "Library" 278:2901 + "Filter" 278:2713) */
function Library() {
  const router = useRouter();
  const params = useSearchParams();
  const { inspirations, tagById, tags, openAdd } = useStore();
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [f, setF] = useState<Filters>({ tags: params.get("tag") ? [params.get("tag")!] : [], caseStudy: false, onDate: null });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (params.get("filter")) {
      setFilterOpen(true);
      router.replace("/library");
    }
  }, [params, router]);

  const list = useMemo(
    () => filterInspirations(inspirations, { query, color, tags: f.tags, caseStudy: f.caseStudy, onDate: f.onDate, tagById }),
    [inspirations, query, color, f, tagById]
  );
  const toggleTag = (id: string) => setF((p) => ({ ...p, tags: p.tags.includes(id) ? p.tags.filter((t) => t !== id) : [...p.tags, id] }));
  const hasFilter = f.tags.length > 0 || f.caseStudy || f.onDate != null;

  const chips = hasFilter ? (
    <div className="filter-chips" aria-label="Active filters">
      {f.tags.map((id) => tagById.get(id) && (
        <span key={id} className="fchip">
          {tagById.get(id)!.name}
          <button aria-label={`Remove ${tagById.get(id)!.name} filter`} onClick={() => toggleTag(id)}><IconClose /></button>
        </span>
      ))}
      {f.caseStudy && (
        <span className="fchip">Case study<button aria-label="Remove case study filter" onClick={() => setF((p) => ({ ...p, caseStudy: false }))}><IconClose /></button></span>
      )}
      {f.onDate != null && (
        <span className="fchip">
          {new Date(f.onDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          <button aria-label="Remove date filter" onClick={() => setF((p) => ({ ...p, onDate: null }))}><IconClose /></button>
        </span>
      )}
    </div>
  ) : null;

  return (
    <main>
      <Backdrop soft />
      <TopMain
        query={query} setQuery={setQuery} color={color} setColor={setColor} items={inspirations}
        selected={f.tags} onChip={toggleTag} onAll={() => setF((p) => ({ ...p, tags: [] }))}
        onFilter={() => setFilterOpen(true)} filterActive={hasFilter} below={chips}
      />

      <div className="lib-list" style={{ paddingBottom: "var(--nav-clearance)" }}>
        {(color || query.trim()) && (
          <div className="section-head" style={{ paddingTop: 4, paddingBottom: 0 }}>
            <span className="h2">{color ? "Similar Colors" : `Results for “${query.trim()}”`}</span>
            <span className="view-all">{list.length} Inspirations</span>
          </div>
        )}
        {list.map((i) => (
          <FlatItem key={i.id} item={i} onOpen={() => router.push(`/inspiration?id=${i.id}`)} />
        ))}
        {list.length === 0 && (
          <div className="empty" style={{ padding: "64px 16px" }}>
            <p className="h2">{inspirations.length ? "No results" : "Your library is empty"}</p>
            <p className="body13" style={{ color: "var(--body)", margin: 0 }}>
              {inspirations.length ? "Try another keyword, color or filter." : "Saved inspirations will be listed here."}
            </p>
            {inspirations.length ? (
              <button className="btn-pill" onClick={() => { setQuery(""); setColor(null); setF({ tags: [], caseStudy: false, onDate: null }); }}>Clear filters</button>
            ) : (
              <button className="btn-pill" onClick={() => openAdd()}>Add inspiration</button>
            )}
          </div>
        )}
      </div>

      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} label="Filter">
        <SubClose>
          {(close) => <FilterPanel initial={f} allTags={tags.map((t) => ({ id: t.id, name: t.name }))} onCancel={close} onApply={(v) => { setF(v); close(); }} />}
        </SubClose>
      </Drawer>
      <BottomNav />
    </main>
  );
}

function FilterPanel({
  initial, allTags, onApply, onCancel,
}: {
  initial: Filters;
  allTags: { id: string; name: string }[];
  onApply: (f: Filters) => void;
  onCancel: () => void;
}) {
  const { inspirations } = useStore();
  const [v, setV] = useState(initial);
  const [dateOpen, setDateOpen] = useState(false);
  const toggle = (id: string) => setV((p) => ({ ...p, tags: p.tags.includes(id) ? p.tags.filter((t) => t !== id) : [...p.tags, id] }));
  return (
    <div className="drawer-body">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="drawer-title">Filter</h2>
        <button type="button" className="btn-link" onClick={() => setV({ tags: [], caseStudy: false, onDate: null })}>Reset</button>
      </div>
      <div className="field">
        <div className="field-head"><span className="label">Classify Tag</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allTags.map((t) => {
            const on = v.tags.includes(t.id);
            return (
              <button key={t.id} type="button" className={`chip-x${on ? "" : " off"}`} aria-pressed={on} onClick={() => toggle(t.id)}>
                {t.name}
                {on && <IconClose size={14} />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="purpose" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button type="button" role="checkbox" aria-checked={v.caseStudy} onClick={() => setV((p) => ({ ...p, caseStudy: !p.caseStudy }))}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
          <IconCheckbox checked={v.caseStudy} />
          For Case study
          {v.onDate != null && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--main-01)" }}>
              · {new Date(v.onDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </button>
        <button type="button" className="icon-btn" aria-label="Filter by reading date" onClick={() => setDateOpen(true)} style={{ color: "var(--gray)" }}>
          <IconCalendarAdd />
        </button>
      </div>
      <Actions onCancel={onCancel} onSave={() => onApply(v)} />
      <Drawer open={dateOpen} onClose={() => setDateOpen(false)} label="Date Picker" sub>
        <SubClose>
          {(close) => (
            <DatePickerPanel
              value={v.onDate} withTime={false} allowClear marks={buildMarks(inspirations)}
              onCancel={close}
              onSave={(ms) => { setV((p) => ({ ...p, onDate: ms, caseStudy: ms != null ? true : p.caseStudy })); close(); }}
            />
          )}
        </SubClose>
      </Drawer>
    </div>
  );
}
