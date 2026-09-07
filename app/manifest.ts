import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "小佳佳的生活日记",
    short_name: "小佳佳",
    description: "记录，让生活更温柔 — 属于她的生活记录站",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF9F7",
    theme_color: "#F16D88",
    lang: "zh-CN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
