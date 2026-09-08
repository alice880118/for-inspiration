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
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <Meta />
        <Links />
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
          background: "#f6f5f1",
          color: "#191919",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div id="app-root" style={{ isolation: "isolate" }}>
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
