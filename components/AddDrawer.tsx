"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveInspiration } from "@/lib/db";
import { useStore } from "./Store";
import { useDraft } from "./useDraft";
import { Drawer, useDrawerClose } from "./ui";
import { InspirationForm } from "./InspirationForm";

/** Drawer_Add Inspiration — mounted once in the root layout, opened from the FAB anywhere. */
export function AddDrawerHost() {
  const { addOpen, closeAdd, addPrefill } = useStore();
  return (
    <Drawer open={addOpen} onClose={closeAdd} label="Add Inspiration">
      <AddBody prefill={addPrefill} />
    </Drawer>
  );
}

function AddBody({ prefill }: { prefill: string }) {
  const draft = useDraft(null, prefill);
  const close = useDrawerClose();
  const { refresh, toast } = useStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <div className="drawer-body">
      <h2 className="drawer-title">Add Inspiration</h2>
      <InspirationForm
        draft={draft}
        saving={saving}
        onCancel={close}
        onSave={async () => {
          setSaving(true);
          try {
            const rec = await saveInspiration(draft.toDraft());
            await refresh();
            close();
            toast("Inspiration saved", { label: "View", run: () => router.push(`/inspiration?id=${rec.id}`) });
          } catch (e) {
            toast(`Could not save: ${(e as Error).message}`);
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
