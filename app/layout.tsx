import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { ComposeSheet } from "@/components/compose-sheet";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeSync } from "@/components/theme-sync";
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
    icon: [
      // 浏览器标签页（传统 .ico，含 16/32/48）
      { url: "/favicon.ico", sizes: "48x48" },
      // 高分屏 / 一般场景
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS 桌面图标
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
        <ThemeSync />
        <ComposeSheet />
        <BottomNav />
        <PwaRegister />
      </body>
    </html>
  );
}
