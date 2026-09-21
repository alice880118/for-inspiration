import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./packages/feedback/feedback.css";
import { StoreProvider } from "@/components/Store";
import { SwRegister } from "@/components/SwRegister";
import { AddDrawerHost } from "@/components/AddDrawer";
import { SplashGate } from "@/components/SplashGate";

export const metadata: Metadata = {
  metadataBase: new URL("https://for-inspiration.vercel.app"),
  title: "Pobbi",
  description: "Your AI-powered inspiration assistant — collect, organize and revisit references.",
  applicationName: "Pobbi",
  appleWebApp: { capable: true, title: "Pobbi", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Pobbi",
    description: "Your AI-powered inspiration assistant — collect, organize and revisit references.",
    url: "/",
    siteName: "Pobbi",
    type: "website",
    images: [{ url: "/og.png", width: 512, height: 512, alt: "Pobbi" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Inputs render at 12px, which makes iOS auto-zoom on focus unless scaling is pinned.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f3f7fb",
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
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <StoreProvider>
          <SplashGate>
            <div className="app">{children}</div>
            <AddDrawerHost />
          </SplashGate>
        </StoreProvider>
        <SwRegister />
      </body>
    </html>
  );
}
