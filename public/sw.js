/* 小佳佳的生活日记 Service Worker */
const CACHE = "jia-blog-v2";
const DATA_CACHE = "jia-blog-data-v2";
const OFFLINE_URL = "/offline.html";

// 私密集合不缓存（数据敏感，且需要凭证）
const PRIVATE_PATHS = ["weight-logs", "period-logs", "private-diary"];

self.addEventListener("install", (event) => {
  // 预缓存固定资源：离线页 / 常用页面骨架 / 图标 / 固定图片
  const PRECACHE = [
    OFFLINE_URL,
    "/",
    "/diary",
    "/me",
    "/beauty",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/images/hero.png",
    "/images/footer.png",
    "/images/envelope.png",
  ];
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {}))),
      ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== DATA_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // 数据接口：公开集合 stale-while-revalidate（先回缓存秒开，后台刷新）；私密集合直连
  if (url.pathname.startsWith("/api/db/")) {
    if (PRIVATE_PATHS.some((p) => url.pathname.includes(p))) return;
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // 其余 API（AI 等）永远直连，不缓存
  if (url.pathname.startsWith("/api/")) return;

  // 页面导航：网络优先，失败回退缓存 → 离线页
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  // 静态资源：缓存优先
  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/");

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && cacheable) {
            caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
          }
          return res;
        }),
    ),
  );
});
