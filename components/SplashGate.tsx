"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getMeta, resetToOnboarding } from "@/lib/db";
import { useStore } from "@/components/Store";
import { Backdrop } from "@/components/ui";
import { PobbiWordmark } from "@/components/Icons";

/** Full-screen 00-1 Splash on every app launch (layout mount). */
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
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
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

      const wait = Math.max(0, 1400 - (Date.now() - started));
      await new Promise<void>((resolve) => window.setTimeout(resolve, wait));
      if (cancelled) return;

      const onRoot = pathRef.current === "/";
      if (onRoot) {
        if (wantReset || !done) router.replace("/welcome");
        else {
          params.delete("reset");
          const q = params.toString();
          router.replace(q ? `/home?${q}` : "/home");
        }
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
