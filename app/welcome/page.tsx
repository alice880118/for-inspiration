"use client";
import Link from "next/link";
import { Backdrop } from "@/components/ui";
import { AppIcon, IconArrowRight } from "@/components/Icons";

/** 00-2 Welcome */
export default function Welcome() {
  return (
    <main className="center-stack" style={{ padding: "0 16px 120px" }}>
      <Backdrop />
      <section className="welcome-card" style={{ width: "100%" }}>
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
      <div className="fixed-cta">
        <Link href="/onboarding" className="btn-primary">
          Next <IconArrowRight />
        </Link>
      </div>
    </main>
  );
}
