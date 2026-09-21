"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconBack } from "./Icons";

export function PageNav({ title, right, backTo, onBack }: { title: string; right?: ReactNode; backTo?: string; onBack?: () => void }) {
  const router = useRouter();
  return (
    <nav className="page-nav" style={{ marginBottom: 8 }}>
      <div className="left">
        <button
          className="back-btn"
          aria-label="Back"
          onClick={() => {
            if (onBack) onBack();
            else if (backTo) router.push(backTo);
            else if (window.history.length > 1) router.back();
            else router.push("/home");
          }}
        >
          <IconBack />
        </button>
        <h1 className="h1" style={{ fontWeight: 600 }}>{title}</h1>
      </div>
      {right}
    </nav>
  );
}
