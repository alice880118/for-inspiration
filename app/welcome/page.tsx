"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Backdrop } from "@/components/ui";
import { AppIcon, IconArrowRight } from "@/components/Icons";

/** 00-2 Welcome */
export default function Welcome() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    router.prefetch("/onboarding");
    router.prefetch("/home");
  }, [router]);

  return (
    <main className={`welcome-page onboarding-transition${leaving ? " is-leaving" : ""}`}>
      <Backdrop />
      <section className="welcome-card">
        <AppIcon width={60} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h1>Pobbi</h1>
            <p className="tag-line">Your AI-powered inspiration assistant.</p>
          </div>
          <p className="desc">
            Save references, organize them with tags,
            <br />
            capture visual details, and revisit them later.
          </p>
        </div>
        <div className="floaty" aria-label="Pobbi captures URL, Tag and Color">
          <span>URL</span>
          <span>Tag</span>
          <span>Color</span>
        </div>
      </section>
      <div className="welcome-cta">
        <Link
          href="/onboarding"
          prefetch
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            if (leaving) return;
            setLeaving(true);
            document.documentElement.classList.add("from-onboarding");
            window.setTimeout(() => router.push("/onboarding"), 460);
          }}
        >
          Next <IconArrowRight />
        </Link>
      </div>
    </main>
  );
}
