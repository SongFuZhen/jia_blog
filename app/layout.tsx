import type { Metadata } from "next";
import { BottomNav } from "@/components/bottom-nav";
import { ComposeSheet } from "@/components/compose-sheet";
import "lxgw-wenkai-lite-webfont/lxgwwenkailite-regular.css";
import "lxgw-wenkai-lite-webfont/lxgwwenkailite-bold.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "小佳佳的生活日记",
  description: "记录，让生活更温柔 — 属于她的生活记录站",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ComposeSheet />
        <BottomNav />
      </body>
    </html>
  );
}
