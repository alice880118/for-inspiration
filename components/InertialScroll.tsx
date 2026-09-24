"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Axis = "x" | "y";

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScroll: number;
  lastTime: number;
  lastScroll: number;
  velocity: number;
  locked: Axis | null;
  moved: boolean;
};

const FRICTION_X = 0.92;
const FRICTION_Y = 0.94;
const MIN_VELOCITY = 0.04;
const MAX_VELOCITY_X = 1.15;
const MAX_VELOCITY_Y = 1.6;
const SAMPLE_WINDOW = 80;
const LOCK_THRESHOLD = 8;
const AXIS_RATIO = 1.12;

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest("input, textarea, select, [contenteditable='true']");
}

export function useInertialScroll<T extends HTMLElement>(axis: Axis = "x") {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const drag: { current: DragState | null } = { current: null };
    const samples: { t: number; s: number }[] = [];
    let raf: number | null = null;
    let skipClick = false;
    const friction = axis === "x" ? FRICTION_X : FRICTION_Y;
    const maxVelocity = axis === "x" ? MAX_VELOCITY_X : MAX_VELOCITY_Y;

    const remember = (scroll: number, time = performance.now()) => {
      samples.push({ t: time, s: scroll });
      while (samples.length > 1 && time - samples[0].t > SAMPLE_WINDOW) samples.shift();
    };

    const sampledVelocity = () => {
      if (samples.length < 2) return 0;
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(16, b.t - a.t);
      const raw = (b.s - a.s) / dt;
      return Math.max(-maxVelocity, Math.min(maxVelocity, raw));
    };

    const getScroll = () => (axis === "x" ? el.scrollLeft : el.scrollTop);
    const setScroll = (value: number) => {
      if (axis === "x") el.scrollLeft = value;
      else el.scrollTop = value;
    };
    const getMax = () =>
      axis === "x" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;

    const cancelMomentum = () => {
      if (raf !== null) {
        window.cancelAnimationFrame(raf);
        raf = null;
      }
      el.classList.remove("is-gliding");
    };

    const snapToNearest = () => {
      if (axis !== "x") return;
      const children = [...el.children] as HTMLElement[];
      if (!children.length) return;
      const box = el.getBoundingClientRect();
      const pad = parseFloat(window.getComputedStyle(el).paddingLeft) || 0;
      const current = getScroll();
      let target = current;
      let best = Number.POSITIVE_INFINITY;
      for (const child of children) {
        const childBox = child.getBoundingClientRect();
        const next = current + childBox.left - box.left - pad;
        const distance = Math.abs(next - current);
        if (distance < best) {
          best = distance;
          target = next;
        }
      }
      const max = Math.max(0, getMax());
      el.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: "smooth" });
    };

    const startMomentum = (initialVelocity: number) => {
      let velocity = Math.max(-maxVelocity, Math.min(maxVelocity, initialVelocity));
      if (Math.abs(velocity) <= MIN_VELOCITY) return;
      let last = performance.now();
      el.classList.add("is-gliding");

      const step = (now: number) => {
        const dt = Math.min(48, now - last);
        last = now;
        const max = Math.max(0, getMax());
        let next = getScroll() + velocity * dt;
        if (next <= 0) {
          next = 0;
          velocity = 0;
        } else if (next >= max) {
          next = max;
          velocity = 0;
        }
        setScroll(next);
        velocity *= Math.pow(friction, dt / 16);

        if (Math.abs(velocity) > MIN_VELOCITY) {
          raf = window.requestAnimationFrame(step);
        } else {
          raf = null;
          el.classList.remove("is-gliding");
          if (axis === "x") snapToNearest();
        }
      };

      raf = window.requestAnimationFrame(step);
    };

    const primaryOf = (e: PointerEvent, d: DragState) =>
      axis === "x" ? e.clientX - d.startX : e.clientY - d.startY;
    const crossOf = (e: PointerEvent, d: DragState) =>
      axis === "x" ? e.clientY - d.startY : e.clientX - d.startX;

    const settle = (primary: number, cross: number): Axis | "pending" => {
      const absPrimary = Math.abs(primary);
      const absCross = Math.abs(cross);
      if (Math.max(absPrimary, absCross) < LOCK_THRESHOLD) return "pending";
      if (absPrimary > absCross * AXIS_RATIO) return axis;
      return axis === "x" ? "y" : "x";
    };

    const onDown = (e: PointerEvent) => {
      if ((e.pointerType === "mouse" && e.button !== 0) || isEditable(e.target) || getMax() <= 0) return;
      cancelMomentum();
      const scroll = getScroll();
      samples.length = 0;
      remember(scroll);
      drag.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startScroll: scroll,
        lastTime: performance.now(),
        lastScroll: scroll,
        velocity: 0,
        locked: null,
        moved: false,
      };
    };

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;

      const primary = primaryOf(e, d);
      const cross = crossOf(e, d);
      if (!d.locked) {
        const nextAxis = settle(primary, cross);
        if (nextAxis === "pending") return;
        if (nextAxis !== axis) {
          drag.current = null;
          return;
        }
        d.locked = axis;
        d.moved = true;
        skipClick = true;
        el.classList.add("is-dragging");
        el.setPointerCapture(e.pointerId);
      }

      if (e.cancelable) e.preventDefault();
      const max = Math.max(0, getMax());
      const next = Math.max(0, Math.min(max, d.startScroll - primary));
      setScroll(next);

      const now = performance.now();
      const dt = Math.max(1, now - d.lastTime);
      d.velocity = (next - d.lastScroll) / dt;
      d.lastScroll = next;
      d.lastTime = now;
      remember(next, now);
    };

    const finish = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      drag.current = null;
      el.classList.remove("is-dragging");
      const fling = sampledVelocity();
      if (d.locked === axis && d.moved && Math.abs(fling) > MIN_VELOCITY) startMomentum(fling);
      else if (d.locked === axis && d.moved && axis === "x") snapToNearest();
      window.setTimeout(() => {
        skipClick = false;
      }, 0);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!skipClick) return;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      cancelMomentum();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [axis]);

  return ref;
}

export function InertialScroll({
  axis = "x",
  className,
  children,
}: {
  axis?: Axis;
  className?: string;
  children: ReactNode;
}) {
  const ref = useInertialScroll<HTMLDivElement>(axis);
  return (
    <div ref={ref} className={`inertia-scroll${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export function InertialY({
  className,
  children,
  style,
}: {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useInertialScroll<HTMLDivElement>("y");
  return (
    <div ref={ref} className={`scroll-body${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
