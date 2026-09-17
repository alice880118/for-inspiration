"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getMeta, resetToOnboarding } from "@/lib/db";
import { useStore } from "@/components/Store";
import { Backdrop } from "@/components/ui";
import { PobbiWordmark } from "@/components/Icons";

/** 00-1 Splash on each cold start, then first-time funnel or Home. */
export function SplashGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const started = Date.now();
    let cancelled = false;

    (async () => {
      router.prefetch("/welcome");
      router.prefetch("/onboarding");
      router.prefetch("/home");

      const params = new URLSearchParams(window.location.search);
      const wantReset = params.get("reset") === "1";
      if (wantReset) {
        try {
          await resetToOnboarding();
          storeRef.current.closeAdd();
          await storeRef.current.refresh();
        } catch {
          /* still treat as first launch */
        }
      }

      let done = false;
      if (!wantReset) {
        try {
          done = await getMeta("hasCompletedOnboarding", false);
        } catch {
          done = false;
        }
      }

      const wait = Math.max(0, 1400 - (Date.now() - started));
      await new Promise<void>((resolve) => window.setTimeout(resolve, wait));
      if (cancelled) return;

      params.delete("reset");
      const q = params.toString();
      const path = pathRef.current;

      if (!done) {
        /* First launch: Welcome → Create First. Stay if already in that funnel. */
        if (path !== "/welcome" && path !== "/onboarding") router.replace("/welcome");
      } else {
        const dest = q ? `/home?${q}` : "/home";
        if (path !== "/home" || q) router.replace(dest);
      }

      setPhase("out");
      window.setTimeout(() => {
        if (!cancelled) setPhase("done");
      }, 280);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      {phase !== "in" ? children : null}
      {phase !== "done" && (
        <div className={`splash${phase === "out" ? " splash-out" : ""}`} aria-label="Loading Pobbi">
          <Backdrop />
          <div className="mark">
            <PobbiWordmark />
          </div>
        </div>
      )}
    </>
  );
}
