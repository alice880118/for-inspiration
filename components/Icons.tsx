/* Icons exported 1:1 from the Figma file (IG · Pobbi). Stroke colors use currentColor where the design allows. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, vb: string, p: P) => ({
  width: size,
  height: size,
  viewBox: vb,
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
  ...p,
});
const s = { strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconArrowRight = ({ size = 16, ...p }: P) => (
  <svg {...base(size, "0 0 16 16", p)}>
    <path d="M3.33301 7.99999H12.6674M8.00021 12.6672L12.6674 7.99999L8.00021 3.33279" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

export const IconLink = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path {...s} stroke="currentColor" d="M14.5563 13.2183C13.514 14.2606 11.8241 14.2606 10.7817 13.2183C9.73943 12.1759 9.73943 10.486 10.7817 9.44364L13.1409 7.0845C14.1357 6.08961 15.7206 6.04433 16.7692 6.94866M16.4437 3.78175C17.486 2.73942 19.1759 2.73942 20.2183 3.78175C21.2606 4.82408 21.2606 6.51403 20.2183 7.55636L17.8591 9.9155C16.8643 10.9104 15.2794 10.9557 14.2308 10.0513" />
    <path {...s} stroke="currentColor" d="M10.4999 3C7.21257 3 5.56889 3 4.46256 3.9079C4.25998 4.07414 4.07423 4.25989 3.90798 4.46247C3.00007 5.56879 3.00006 7.21247 3.00002 10.4998L3 12.9999C2.99996 16.7712 2.99995 18.6568 4.17152 19.8284C5.3431 21 7.22873 21 11 21H13.4999C16.7874 21 18.4311 21 19.5375 20.092C19.74 19.9258 19.9257 19.7401 20.092 19.5376C20.9999 18.4312 20.9999 16.7875 20.9999 13.5" />
  </svg>
);

export const IconImageUpload = ({ size = 36, ...p }: P) => (
  <svg {...base(size, "0 0 36 36", p)}>
    <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M28.125 23.25V32.25" />
      <path d="M10.875 13.5C12.1176 13.5 13.125 12.4926 13.125 11.25C13.125 10.0074 12.1176 9 10.875 9C9.63236 9 8.625 10.0074 8.625 11.25C8.625 12.4926 9.63236 13.5 10.875 13.5Z" />
      <path d="M31.8741 16.5C31.8625 10.7703 31.7135 7.76224 29.7882 5.83686C27.7013 3.75 24.3425 3.75 17.625 3.75C10.9075 3.75 7.54873 3.75 5.46186 5.83686C3.375 7.92373 3.375 11.2825 3.375 18C3.375 24.7174 3.375 28.0762 5.46186 30.1632C7.54873 32.25 10.9075 32.25 17.625 32.25C18.7097 32.25 19.7067 32.25 20.625 32.2411" />
      <path d="M22.1277 18.3591C16.5187 19.8456 11.9576 25.6766 7.75195 30.75" />
      <path d="M23.625 26.25C23.625 26.25 26.9393 21.75 28.125 21.75C29.3109 21.75 32.625 26.25 32.625 26.25" />
    </g>
  </svg>
);

export const IconUpload = ({ size = 16, ...p }: P) => (
  <svg {...base(size, "0 0 17 16", { width: size * 17 / 16, ...p })}>
    <path {...s} stroke="currentColor" d="M2.125 11.3333C2.125 11.9533 2.125 12.2633 2.19741 12.5177C2.3939 13.2078 2.96669 13.7469 3.70001 13.9319C3.97024 14 4.2996 14 4.95833 14H12.0416C12.7004 14 13.0298 14 13.3 13.9319C14.0333 13.7469 14.6061 13.2078 14.8026 12.5177C14.875 12.2633 14.875 11.9533 14.875 11.3333" />
    <path {...s} stroke="currentColor" d="M11.6875 4.99995C11.6875 4.99995 9.33993 1.99998 8.49999 1.99997C7.65997 1.99996 5.3125 4.99997 5.3125 4.99997M8.49999 2.66664V10.6667" />
  </svg>
);

export const IconImageSparkle = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <g {...s} stroke="currentColor">
      <path d="M4.85742 15.1429L8.26 12.1183C8.55105 11.8596 8.9458 11.7143 9.35742 11.7143C9.76904 11.7143 10.1638 11.8596 10.4548 12.1183L12.6453 14.0653C13.2167 14.5733 13.5024 14.8272 13.8574 14.8272C14.2125 14.8272 14.4981 14.5733 15.0696 14.0653L15.5457 13.6421C15.8367 13.3834 16.2315 13.2381 16.6431 13.2381C17.0547 13.2381 17.4495 13.3834 17.7405 13.6421L19.4289 15.1429" />
      <path d="M19.4286 11.2857V12.5714C19.4286 16.2079 19.4286 18.0263 18.2989 19.156C17.1691 20.2857 15.3508 20.2857 11.7143 20.2857C8.07774 20.2857 6.25946 20.2857 5.12973 19.156C4 18.0263 4 16.2079 4 12.5714C4 8.93487 4 7.11659 5.12973 5.98686C6.25946 4.85713 8.07774 4.85713 11.7143 4.85713H13" />
      <path d="M18.1429 4.80357V6.14286M18.1429 6.14286V7.48214M18.1429 6.14286H17.0714M18.1429 6.14286H19.2143M20.2857 6.14286L19.3562 5.83302C18.9296 5.69083 18.5949 5.35609 18.4527 4.92951L18.1429 4L17.833 4.92951C17.6908 5.35609 17.3561 5.69083 16.9295 5.83302L16 6.14286L16.9295 6.4527C17.3561 6.59489 17.6908 6.92962 17.833 7.3562L18.1429 8.28571L18.4527 7.3562C18.5949 6.92962 18.9296 6.59489 19.3562 6.4527L20.2857 6.14286Z" />
    </g>
  </svg>
);

export const IconPlus = ({ size = 24, strokeWidth = 1.5, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d="M12.001 5V19.002M19.002 12.002H5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const homeGrad = (id: string) => (
  <linearGradient id={id} x1="3" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
    <stop />
    <stop offset="0.725962" stopColor="#3A3A3A" />
  </linearGradient>
);
const HOME_PATH =
  "M3 11.9896V14.5C3 17.7998 3 19.4497 4.02513 20.4749C5.05025 21.5 6.70017 21.5 10 21.5H14C17.2998 21.5 18.9497 21.5 19.9749 20.4749C21 19.4497 21 17.7998 21 14.5V11.9896C21 10.3083 21 9.46773 20.6441 8.74005C20.2882 8.01237 19.6247 7.49628 18.2976 6.46411L16.2976 4.90855C14.2331 3.30285 13.2009 2.5 12 2.5C10.7991 2.5 9.76689 3.30285 7.70242 4.90855L5.70241 6.46411C4.37533 7.49628 3.71179 8.01237 3.3559 8.74005C3 9.46773 3 10.3083 3 11.9896Z";

export const IconHome = ({ size = 24, active = false, ...p }: P & { active?: boolean }) => (
  <svg {...base(size, "0 0 24 24", p)}>
    {active ? (
      <>
        <path d={HOME_PATH} fill="url(#pb-home-g)" stroke="url(#pb-home-g)" {...s} />
        <path d="M17 17.5V13.5" stroke="white" {...s} />
        <defs>{homeGrad("pb-home-g")}</defs>
      </>
    ) : (
      <>
        <path d={HOME_PATH} stroke="currentColor" {...s} />
        <path d="M17 17.5V13.5" stroke="currentColor" {...s} />
      </>
    )}
  </svg>
);

export const IconLibrary = ({ size = 24, active = false, ...p }: P & { active?: boolean }) => (
  <svg {...base(size, "0 0 24 24", p)}>
    {[[2, 2], [14, 2], [2, 14], [14, 14]].map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width={8} height={8} rx={3} stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} />
    ))}
  </svg>
);

export const IconCalendarAdd = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <g {...s} stroke="currentColor">
      <path d="M16 2V6M8 2V6" />
      <path d="M21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13" />
      <path d="M3 10H21" />
      <path d="M17.5 15V22M21 18.5H14" />
    </g>
  </svg>
);

export const IconSort = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d="M4 7H20M7 12H17M9 17H15" stroke="currentColor" {...s} />
  </svg>
);

export const IconDots9 = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    {[6, 12, 18].flatMap((x) =>
      [6.5, 12.5, 18.5].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1} stroke="currentColor" strokeWidth={1.5} />)
    )}
  </svg>
);

export const IconSearch = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d="M17 17L21 21" stroke="currentColor" {...s} />
    <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" stroke="currentColor" {...s} />
  </svg>
);

export const IconClose = ({ size = 20, ...p }: P) => (
  <svg {...base(size, "0 0 20 20", p)}>
    <path d="M15 5L5.00068 14.9993M14.9993 15L5 5.00071" stroke="currentColor" {...s} />
  </svg>
);

export const IconImage = ({ size = 32, ...p }: P) => (
  <svg {...base(size, "0 0 32 32", p)}>
    <path d="M28 19.9996L23.8853 15.8849C23.3853 15.385 22.7071 15.1042 22 15.1042C21.2929 15.1042 20.6147 15.385 20.1147 15.8849L8 27.9996M6.66667 4H25.3333C26.8061 4 28 5.19391 28 6.66667V25.3333C28 26.8061 26.8061 28 25.3333 28H6.66667C5.19391 28 4 26.8061 4 25.3333V6.66667C4 5.19391 5.19391 4 6.66667 4ZM14.6667 12C14.6667 13.4728 13.4728 14.6667 12 14.6667C10.5272 14.6667 9.33333 13.4728 9.33333 12C9.33333 10.5272 10.5272 9.33333 12 9.33333C13.4728 9.33333 14.6667 10.5272 14.6667 12Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

export const IconArrowUpRight = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d="M9.27273 7.13666C9.27273 7.13666 15.5803 6.64327 16.4686 7.53148C17.3568 8.4197 16.8633 14.7273 16.8633 14.7273M16.0909 7.90909L7 17" stroke="currentColor" {...s} />
  </svg>
);

export const IconMore = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 30 24", { width: size * 1.25, ...p })}>
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="21" cy="12" r="1" fill="currentColor" />
  </svg>
);

const BOX = "M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z";
export const IconCheckbox = ({ size = 24, checked = false, ...p }: P & { checked?: boolean }) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d={BOX} stroke="black" strokeWidth={1.5} fill={checked ? "black" : "none"} />
    {checked && <path d="M8 12.5L10.5 15L16 9" stroke="white" {...s} />}
  </svg>
);

export const IconPencil = ({ size = 20, ...p }: P) => (
  <svg {...base(size, "0 0 20 20", p)}>
    <path d="M3.15151 13.591L2.5 17.5L6.40905 16.8485C7.08787 16.7354 7.71438 16.413 8.20099 15.9263L17.0165 7.11073C17.6612 6.46601 17.6612 5.42075 17.0164 4.77605L15.2239 2.98353C14.5792 2.33881 13.5338 2.33882 12.8891 2.98356L4.07368 11.7992C3.58706 12.2857 3.26464 12.9122 3.15151 13.591Z" stroke="currentColor" {...s} />
    <path d="M11.6665 5L14.9998 8.33333" stroke="currentColor" {...s} />
  </svg>
);

export const IconColorAdd = ({ size = 21, ...p }: P) => (
  <svg {...base(size, "0 0 21 21", p)}>
    <rect x="0.5" y="0.5" width="20" height="20" rx="10" fill="white" />
    <rect x="0.5" y="0.5" width="20" height="20" rx="10" stroke="black" strokeLinecap="round" strokeDasharray="4 4" />
    <path d="M9.7 13.7V11.3H7.3C6.85817 11.3 6.5 10.9418 6.5 10.5C6.5 10.0582 6.85817 9.7 7.3 9.7H9.7V7.3C9.7 6.85817 10.0582 6.5 10.5 6.5C10.9418 6.5 11.3 6.85817 11.3 7.3V9.7H13.7C14.1418 9.7 14.5 10.0582 14.5 10.5C14.5 10.9418 14.1418 11.3 13.7 11.3H11.3V13.7C11.3 14.1418 10.9418 14.5 10.5 14.5C10.0582 14.5 9.7 14.1418 9.7 13.7Z" fill="black" />
  </svg>
);

export const IconBack = ({ size = 18, ...p }: P) => (
  <svg {...base(size, "0 0 18 18", p)}>
    <path d="M4.1235 9H14.2485" stroke="currentColor" {...s} />
    <path d="M8.24854 13.5C8.24854 13.5 3.74861 10.1858 3.74853 9C3.74853 7.8141 8.24854 4.5 8.24854 4.5" stroke="currentColor" {...s} />
  </svg>
);

export function PobbiWordmark({ width = 178 }: { width?: number }) {
  const height = Math.round((width * 37.2188) / 178);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/pobbi-wordmark.svg"
      alt="Pobbi"
      width={width}
      height={height}
      style={{ display: "block", width, height }}
    />
  );
}

export function AppIcon({ width = 60 }: { width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-192.png"
      alt="Pobbi"
      width={width}
      height={width}
      style={{ borderRadius: Math.round(width * 0.2), display: "block" }}
    />
  );
}

export const IconCalendarFilled = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d="M16 2V6M8 2V6" stroke="currentColor" {...s} />
    <path d="M21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13" fill="currentColor" stroke="currentColor" {...s} />
    <path d="M3 10H21" stroke="white" {...s} />
    <path d="M17.5 15V22M21 18.5H14" stroke="currentColor" {...s} strokeWidth={2.2} />
  </svg>
);

export const IconDateSelect = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <g clipPath="url(#pb-date-select-clip)">
      <path d="M13 3.25C14.8644 3.25 16.3384 3.24859 17.4893 3.40332C18.6616 3.56096 19.6101 3.89328 20.3584 4.6416C21.1067 5.38991 21.439 6.33844 21.5967 7.51074C21.7514 8.66159 21.75 10.1356 21.75 12V16.5C21.75 16.9142 21.4142 17.25 21 17.25C20.9882 17.25 20.9765 17.2486 20.9648 17.248C20.9428 17.8218 20.9076 18.3239 20.8477 18.7695C20.7001 19.8671 20.4226 20.4993 19.9609 20.9609C19.4993 21.4226 18.8671 21.7001 17.7695 21.8477C17.3239 21.9075 16.8218 21.9428 16.248 21.9648C16.2486 21.9765 16.25 21.9882 16.25 22C16.25 22.4142 15.9142 22.75 15.5 22.75H11C9.13558 22.75 7.66159 22.7514 6.51074 22.5967C5.33844 22.439 4.38991 22.1067 3.6416 21.3584C2.89328 20.6101 2.56096 19.6616 2.40332 18.4893C2.24859 17.3384 2.25 15.8644 2.25 14V12C2.25 10.1356 2.24859 8.66159 2.40332 7.51074C2.56096 6.33844 2.8933 5.38991 3.6416 4.6416C4.38991 3.8933 5.33844 3.56096 6.51074 3.40332C7.66159 3.24859 9.13558 3.25 11 3.25H13Z" fill="url(#pb-date-select-0)" />
      <path d="M19 9.25C19.4142 9.25 19.75 9.58579 19.75 10C19.75 10.4142 19.4142 10.75 19 10.75H5C4.58579 10.75 4.25 10.4142 4.25 10C4.25 9.58579 4.58579 9.25 5 9.25H19Z" fill="white" />
      <circle cx="19" cy="19" r="5" fill="white" />
      <path d="M18.25 22V19.75H16C15.5858 19.75 15.25 19.4142 15.25 19C15.25 18.5858 15.5858 18.25 16 18.25H18.25V16C18.25 15.5858 18.5858 15.25 19 15.25C19.4142 15.25 19.75 15.5858 19.75 16V18.25H22C22.4142 18.25 22.75 18.5858 22.75 19C22.75 19.4142 22.4142 19.75 22 19.75H19.75V22C19.75 22.4142 19.4142 22.75 19 22.75C18.5858 22.75 18.25 22.4142 18.25 22Z" fill="url(#pb-date-select-1)" />
      <path d="M7.25 4V1C7.25 0.585786 7.58579 0.25 8 0.25C8.41421 0.25 8.75 0.585786 8.75 1V4C8.75 4.41421 8.41421 4.75 8 4.75C7.58579 4.75 7.25 4.41421 7.25 4ZM15.25 4V1C15.25 0.585786 15.5858 0.25 16 0.25C16.4142 0.25 16.75 0.585786 16.75 1V4C16.75 4.41421 16.4142 4.75 16 4.75C15.5858 4.75 15.25 4.41421 15.25 4Z" fill="url(#pb-date-select-2)" />
      <path d="M7.25 4V6C7.25 6.41421 7.58579 6.75 8 6.75C8.41421 6.75 8.75 6.41421 8.75 6V4C8.75 3.58579 8.41421 3.25 8 3.25C7.58579 3.25 7.25 3.58579 7.25 4ZM15.25 4V6C15.25 6.41421 15.5858 6.75 16 6.75C16.4142 6.75 16.75 6.41421 16.75 6V4C16.75 3.58579 16.4142 3.25 16 3.25C15.5858 3.25 15.25 3.58579 15.25 4Z" fill="white" />
    </g>
    <defs>
      <linearGradient id="pb-date-select-0" x1="2.25" y1="13" x2="21.75" y2="13" gradientUnits="userSpaceOnUse">
        <stop />
        <stop offset="0.725962" stopColor="#3A3A3A" />
      </linearGradient>
      <linearGradient id="pb-date-select-1" x1="15.25" y1="19" x2="22.75" y2="19" gradientUnits="userSpaceOnUse">
        <stop />
        <stop offset="0.725962" stopColor="#3A3A3A" />
      </linearGradient>
      <linearGradient id="pb-date-select-2" x1="7.25" y1="2.5" x2="16.75" y2="2.5" gradientUnits="userSpaceOnUse">
        <stop />
        <stop offset="0.725962" stopColor="#3A3A3A" />
      </linearGradient>
      <clipPath id="pb-date-select-clip">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const IconChevron = ({ size = 14, dir = "right", ...p }: P & { dir?: "left" | "right" }) => (
  <svg {...base(size, "0 0 14 14", p)}>
    <path d={dir === "right" ? "M5.25 10.5L8.75 7L5.25 3.5" : "M8.75 10.5L5.25 7L8.75 3.5"} stroke="currentColor" strokeWidth={size <= 14 ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconGrip = ({ size = 16, ...p }: P) => (
  <svg {...base(size, "0 0 16 16", p)}>
    {[6, 10].flatMap((x) => [3.33, 8, 12.67].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={1} fill="currentColor" />))}
  </svg>
);

export const IconEyedropper = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <g stroke="currentColor" {...s}>
      <path d="M13.435 7L7.15915 13.2759M17 10.565L14.2891 13.2759L8.39227 19.1727C7.49068 20.0743 7.03988 20.5251 6.46663 20.7626C5.89338 21 5.25586 21 3.98082 21H3V20.0192C3 18.7441 3 18.1066 3.23745 17.5334C3.47489 16.9601 3.92569 16.5093 4.82728 15.6077L7.15915 13.2759M7.15915 13.2759H14.2891" />
      <path d="M19.2087 8.38869L20.82 10M19.2087 8.38869L20.0705 7.52682C20.363 7.23431 20.5093 7.08805 20.611 6.94529C21.1297 6.21676 21.1297 5.23953 20.611 4.511C20.5093 4.36824 20.363 4.22198 20.0705 3.92947C19.778 3.63697 19.6318 3.4907 19.489 3.38905C18.7605 2.87032 17.7832 2.87032 17.0547 3.38905C16.912 3.4907 16.7657 3.63695 16.4732 3.92947L15.6113 4.79133M14 3.18002L15.6113 4.79133L19.2087 8.38869" />
    </g>
  </svg>
);

export const IconBell = ({ size = 24, ...p }: P) => (
  <svg {...base(size, "0 0 24 24", p)}>
    <path d="M5.15837 11.491C5.08489 12.887 5.16936 14.373 3.92213 15.3084C3.34164 15.7438 3 16.427 3 17.1527C3 18.1508 3.7818 19 4.8 19H19.2C20.2182 19 21 18.1508 21 17.1527C21 16.427 20.6584 15.7438 20.0779 15.3084C18.8306 14.373 18.9151 12.887 18.8416 11.491C18.6501 7.85223 15.6438 5 12 5C8.35617 5 5.34988 7.85222 5.15837 11.491Z" stroke="currentColor" {...s} />
    <path d="M10.5 3.125C10.5 3.95343 11.1716 5 12 5C12.8284 5 13.5 3.95343 13.5 3.125C13.5 2.29657 12.8284 2 12 2C11.1716 2 10.5 2.29657 10.5 3.125Z" stroke="currentColor" {...s} />
    <path d="M15 19C15 20.6569 13.6569 22 12 22C10.3431 22 9 20.6569 9 19" stroke="currentColor" {...s} />
  </svg>
);

export const IconKebab = ({ size = 20, ...p }: P) => (
  <svg {...base(size, "0 0 20 20", p)}>
    {[4.5, 10, 15.5].map((y) => <circle key={y} cx={10} cy={y} r={1.4} fill="currentColor" />)}
  </svg>
);

export const IconPlusSm = ({ size = 16, ...p }: P) => (
  <svg {...base(size, "0 0 16 16", p)}>
    <path d="M3.3328 8H12.6672M8 3.3328V12.6672" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);
