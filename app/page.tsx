"use client";
import { useEffect, useRef } from "react";
import { getMeta, resetToOnboarding } from "@/lib/db";
import { useStore } from "@/components/Store";
import { Backdrop } from "@/components/ui";
import { PobbiWordmark } from "@/components/Icons";

/** 00-1 Splash — brand + decide first-time vs returning user. */
export default function Splash() {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const started = Date.now();
    /* Full load so the SW can serve cached HTML when offline (client RSC fetch cannot). */
    const go = (path: string) => window.location.replace(path);

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const wantReset = params.get("reset") === "1";
      if (wantReset) {
        try {
          await Promise.race([
            resetToOnboarding().then(async () => {
              storeRef.current.closeAdd();
              await storeRef.current.refresh();
            }),
            new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
          ]);
        } catch {
          /* still route to welcome */
        }
      }

      let done = false;
      try {
        done = wantReset ? false : await Promise.race([
          getMeta("hasCompletedOnboarding", false),
          new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 1500)),
        ]);
      } catch {
        done = false;
      }

      const wait = Math.max(0, 1100 - (Date.now() - started));
      window.setTimeout(() => {
        if (wantReset || !done) {
          go("/welcome");
          return;
        }
        params.delete("reset");
        const q = params.toString();
        go(q ? `/home?${q}` : "/home");
      }, wait);
    })();
  }, []);

  return (
    <main className="splash" aria-label="Loading Pobbi">
      <Backdrop />
      <div className="mark">
        <PobbiWordmark width={112} />
      </div>
    </main>
  );
}
