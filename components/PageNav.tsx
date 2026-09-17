"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconBack } from "./Icons";

export function PageNav({ title, right, backTo }: { title: string; right?: ReactNode; backTo?: string }) {
  const router = useRouter();
  return (
    <nav className="page-nav" style={{ marginBottom: 8 }}>
      <div className="left">
        <button
          className="back-btn"
          aria-label="Back"
          onClick={() => (backTo ? router.push(backTo) : window.history.length > 1 ? router.back() : router.push("/home"))}
        >
          <IconBack />
        </button>
        <h1 className="h1" style={{ fontWeight: 600 }}>{title}</h1>
      </div>
      {right}
    </nav>
  );
}
