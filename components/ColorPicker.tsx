"use client";
import { useRef, useState } from "react";
import { IconBack, IconEyedropper } from "./Icons";
import { useStore } from "./Store";

/* ---------- color math ---------- */
type HSV = { h: number; s: number; v: number };
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));

export function hexToHsvA(hex: string): { hsv: HSV; a: number } {
  const h = hex.replace("#", "");
  const n = parseInt(h.slice(0, 6).padEnd(6, "0"), 16) || 0;
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { hsv: { h: hue, s: max ? d / max : 0, v: max }, a };
}

export function hsvToHex({ h, s, v }: HSV, a = 1): string {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  const hex = `#${to(f(5))}${to(f(3))}${to(f(1))}`.toUpperCase();
  return a < 0.995 ? hex + to(a).toUpperCase() : hex;
}

function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || pointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height));
  };
  const finish = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    pointerId.current = null;
  };
  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    pointerId.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    move(e);
  };
  return {
    ref,
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: finish,
    onPointerCancel: finish,
  };
}

/**
 * Figma "Color picker" (276:2046, multi, with thumbnail) and
 * "Color picker" (282:1590, single, with back arrow).
 */
export function ColorPickerPanel({
  colors: initial, multi = true, image, onBack, onSave, onCancel, startIndex = 0,
}: {
  colors: string[];
  multi?: boolean;
  image?: string | null;
  onBack?: () => void;
  onSave: (colors: string[]) => void;
  onCancel: () => void;
  startIndex?: number;
}) {
  const { toast } = useStore();
  const [list, setList] = useState<string[]>(initial.length ? initial : ["#AAD7F9"]);
  const [idx, setIdx] = useState(Math.min(startIndex, Math.max(0, initial.length - 1)));
  const start = hexToHsvA(list[idx] ?? "#AAD7F9");
  const [hsv, setHsv] = useState<HSV>(start.hsv);
  const [alpha, setAlpha] = useState(start.a);
  const [hexText, setHexText] = useState(hsvToHex(start.hsv).slice(1));
  const [imagePicker, setImagePicker] = useState(false);
  const [loupe, setLoupe] = useState<null | {
    left: number;
    top: number;
    backgroundSize: string;
    backgroundPosition: string;
    color: string;
  }>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // select another swatch → load it into the controls
  const select = (i: number, from = list) => {
    setIdx(i);
    const { hsv: h, a } = hexToHsvA(from[i]);
    setHsv(h);
    setAlpha(a);
    setHexText(hsvToHex(h).slice(1));
  };

  const commit = (h: HSV, a: number) => {
    setHsv(h);
    setAlpha(a);
    setHexText(hsvToHex(h).slice(1));
    setList((l) => l.map((c, i) => (i === idx ? hsvToHex(h, a) : c)));
  };

  const sv = useDrag((x, y) => commit({ ...hsv, s: x, v: 1 - y }, alpha));
  const hue = useDrag((x) => commit({ ...hsv, h: x * 359.9 }, alpha));
  const alp = useDrag((x) => commit(hsv, x));

  const pickFromScreen = async () => {
    if (image) {
      setImagePicker((active) => {
        if (!active) toast("Press and drag on the image to pick a color");
        return !active;
      });
      setLoupe(null);
      return;
    }
    const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (ED) {
      try {
        const { sRGBHex } = await new ED().open();
        commit(hexToHsvA(sRGBHex).hsv, alpha);
      } catch { /* cancelled */ }
    } else toast("Eyedropper isn't supported in this browser");
  };

  const sampleImage = (e: React.PointerEvent<HTMLImageElement>, finish = false) => {
    if (!imagePicker) return;
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return;
    if (e.type === "pointerdown") img.setPointerCapture(e.pointerId);
    const r = img.getBoundingClientRect();
    // object-fit: cover mapping
    const scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const dx = (r.width - img.naturalWidth * scale) / 2;
    const dy = (r.height - img.naturalHeight * scale) / 2;
    const localX = clamp(e.clientX - r.left, 0, r.width);
    const localY = clamp(e.clientY - r.top, 0, r.height);
    const x = Math.min(img.naturalWidth - 1, Math.max(0, Math.floor((localX - dx) / scale)));
    const y = Math.min(img.naturalHeight - 1, Math.max(0, Math.floor((localY - dy) / scale)));
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let pixel: Uint8ClampedArray;
    try {
      ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
      pixel = ctx.getImageData(0, 0, 1, 1).data;
    } catch {
      setImagePicker(false);
      setLoupe(null);
      toast("This image cannot be sampled");
      return;
    }
    const [R, G, B] = pixel;
    const sampled = "#" + [R, G, B].map((v) => v.toString(16).padStart(2, "0")).join("");
    commit(hexToHsvA(sampled).hsv, alpha);
    setLoupe({
      left: localX,
      top: localY,
      backgroundSize: `${img.naturalWidth * scale * 4}px ${img.naturalHeight * scale * 4}px`,
      backgroundPosition: `${24 - (localX - dx) * 4}px ${24 - (localY - dy) * 4}px`,
      color: sampled,
    });
    if (finish) {
      setImagePicker(false);
      window.setTimeout(() => setLoupe(null), 180);
    }
  };

  const pure = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const solid = hsvToHex(hsv);

  return (
    <div className="drawer-body">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onBack && (
          <button type="button" className="icon-btn" aria-label="Back" onClick={onBack} style={{ margin: "-4px 0 -4px -6px" }}>
            <IconBack size={20} />
          </button>
        )}
        <h2 className="drawer-title">Color picker</h2>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {image && (
          <div className={`cp-thumb${imagePicker ? " picking" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={image}
              alt="Press and drag to pick a color from the image"
              onPointerDown={(e) => sampleImage(e)}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) sampleImage(e);
              }}
              onPointerUp={(e) => sampleImage(e, true)}
              onPointerCancel={() => {
                setImagePicker(false);
                setLoupe(null);
              }}
              draggable={false}
            />
            {loupe && (
              <span
                className="cp-loupe"
                aria-hidden
                style={{
                  left: loupe.left,
                  top: loupe.top,
                  backgroundImage: `url("${image}")`,
                  backgroundSize: loupe.backgroundSize,
                  backgroundPosition: loupe.backgroundPosition,
                  borderColor: loupe.color,
                }}
              />
            )}
          </div>
        )}
        <div
          {...sv}
          className="cp-sv"
          role="slider"
          aria-label="Saturation and brightness"
          aria-valuetext={solid}
          style={{ background: `linear-gradient(180deg, rgba(0,0,0,0), #000), linear-gradient(90deg, #fff, ${pure})`, height: image ? 188 : 188 }}
        >
          <span className="cp-handle" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: -8 }}>
        <div {...hue} className="cp-bar cp-hue" role="slider" aria-label="Hue" aria-valuenow={Math.round(hsv.h)} aria-valuemin={0} aria-valuemax={360}>
          <span className="cp-handle" style={{ left: `${(hsv.h / 360) * 100}%` }} />
        </div>
        <div {...alp} className="cp-bar cp-alpha" role="slider" aria-label="Opacity" aria-valuenow={Math.round(alpha * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ background: `linear-gradient(90deg, ${solid}00, ${solid})` }} />
          <span className="cp-handle" style={{ left: `${alpha * 100}%` }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button
          type="button"
          className={`cp-eyedropper${imagePicker ? " on" : ""}`}
          aria-label={image ? "Pick a color from the image" : "Pick a color from the screen"}
          aria-pressed={image ? imagePicker : undefined}
          onClick={pickFromScreen}
        >
          <IconEyedropper />
        </button>
        <div style={{ flex: 1, display: "flex", gap: 8, fontSize: 14, fontWeight: 500 }}>
          <label className="cp-input" style={{ flex: 1 }}>
            <span style={{ color: "#969298", width: 10 }}>#</span>
            <input
              value={hexText}
              maxLength={6}
              aria-label="Hex color"
              spellCheck={false}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9a-f]/gi, "").toUpperCase();
                setHexText(v);
                if (v.length === 6) {
                  const h = hexToHsvA("#" + v).hsv;
                  setHsv(h);
                  setList((l) => l.map((c, i) => (i === idx ? hsvToHex(h, alpha) : c)));
                }
              }}
            />
          </label>
          <label className="cp-input" style={{ width: 72 }}>
            <input
              value={Math.round(alpha * 100)}
              inputMode="numeric"
              aria-label="Opacity percent"
              onChange={(e) => {
                const n = clamp((parseInt(e.target.value, 10) || 0) / 100);
                commit(hsv, n);
              }}
              style={{ width: "3.2ch", textAlign: "right" }}
            />
            <span style={{ color: "#969298" }}>%</span>
          </label>
        </div>
      </div>

      <div className="field">
        <span className="label">Select colors</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {list.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`cp-swatch${i === idx ? " on" : ""}`}
              style={{ background: c }}
              aria-label={`Color ${i + 1}: ${c}`}
              aria-pressed={i === idx}
              onClick={() => select(i)}
            >
              {multi && i === idx && list.length > 1 && (
                <span
                  role="button"
                  aria-label="Remove this color"
                  className="cp-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = list.filter((_, k) => k !== i);
                    setList(next);
                    select(Math.max(0, i - 1), next);
                  }}
                >
                  ×
                </span>
              )}
            </button>
          ))}
          {multi && list.length < 8 && (
            <button
              type="button"
              className="cp-swatch add"
              aria-label="Add color"
              onClick={() => {
                const next = [...list, hsvToHex(hsv, alpha)];
                setList(next);
                select(next.length - 1, next);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M10 4.17V15.84M15.84 10H4.17" stroke="#9D9D9D" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-m line" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-m fill" onClick={() => onSave(list)}>Save</button>
      </div>
    </div>
  );
}
