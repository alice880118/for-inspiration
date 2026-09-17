/** Figma alert-triangle leaf: 18×16 (popup) / 16×14 (toast). */
export function AlertTriangle({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M7.29 1.86 0.82 13.2A1.6 1.6 0 0 0 2.2 15.5h13.6a1.6 1.6 0 0 0 1.38-2.3L10.71 1.86a1.6 1.6 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 5.6v3.4M9 11.4h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
