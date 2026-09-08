import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export const meta: MetaFunction = () => [
  { title: "靈感收集器" },
  {
    name: "description",
    content: "把靈感網址、分類、標籤與縮圖保存在自己的裝置。",
  },
  { name: "theme-color", content: "#f6f5f1" },
  { name: "apple-mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-status-bar-style", content: "default" },
  { name: "apple-mobile-web-app-title", content: "靈感收集器" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <Meta />
        <Links />
        <style
          dangerouslySetInnerHTML={{
            __html: [
              "html,body{width:100%;max-width:100%;overflow-x:hidden;-webkit-text-size-adjust:100%}",
              "*,*::before,*::after{box-sizing:border-box;scrollbar-width:none;-ms-overflow-style:none}",
              "*::-webkit-scrollbar{width:0;height:0;display:none}",
              "input,textarea,select,button{font-size:16px}",
              ".sheet-backdrop{position:fixed;inset:0;min-height:100dvh}",
              "@supports (-webkit-touch-callout: none){.sheet-backdrop{position:absolute}}",
            ].join(""),
          }}
        />
        <link rel="manifest" href="/for-inspiration/manifest.webmanifest" />
        <link rel="icon" href="/for-inspiration/icons/icon.svg" />
        <link
          rel="apple-touch-icon"
          href="/for-inspiration/icons/apple-touch-icon.png"
        />
      </head>
      <body
        style={{
          margin: 0,
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          background: "#f6f5f1",
          color: "#191919",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          id="app-root"
          style={{ isolation: "isolate", width: "100%", maxWidth: "100%" }}
        >
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <main
      style={{
        minHeight: "calc(100dvh - 48px)",
        display: "grid",
        placeItems: "center",
        color: "#6f6f6f",
      }}
    >
      正在載入靈感收集器…
    </main>
  );
}

export default function App() {
  return <Outlet />;
}
