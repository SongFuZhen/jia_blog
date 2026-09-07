import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { ComposeSheet } from "@/components/compose-sheet";
import { PwaRegister } from "@/components/pwa-register";
import "lxgw-wenkai-lite-webfont/lxgwwenkailite-regular.css";
import "lxgw-wenkai-lite-webfont/lxgwwenkailite-bold.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "小佳佳的生活日记",
  description: "记录，让生活更温柔 — 属于她的生活记录站",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "小佳佳",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FDF9F7",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ComposeSheet />
        <BottomNav />
        <PwaRegister />
      </body>
    </html>
  );
}
