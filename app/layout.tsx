import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./packages/feedback/feedback.css";
import { StoreProvider } from "@/components/Store";
import { SwRegister } from "@/components/SwRegister";
import { AddDrawerHost } from "@/components/AddDrawer";

export const metadata: Metadata = {
  title: "Pobbi",
  description: "Your AI-powered inspiration assistant — collect, organize and revisit references.",
  applicationName: "Pobbi",
  appleWebApp: { capable: true, title: "Pobbi", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <StoreProvider>
          <div className="app">{children}</div>
          <AddDrawerHost />
        </StoreProvider>
        <SwRegister />
      </body>
    </html>
  );
}
