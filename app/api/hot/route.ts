import { NextResponse, type NextRequest } from "next/server";
import type { HotItem, HotSource } from "@/lib/types";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const TIMEOUT = 10000;
const CACHE_TTL = 5 * 60 * 1000;

const cache = new Map<HotSource, { at: number; items: HotItem[] }>();

const LABELS: Record<HotSource, string> = {
  weibo: "微博热搜",
  toutiao: "今日头条",
  baidu: "百度热搜",
  zhihu: "知乎热榜",
  x: "X 热搜",
  reddit: "Reddit",
};

function fmtHot(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")} 万`;
  return String(n);
}

async function getJson<T>(
  url: string,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`上游返回 ${res.status}`);
  return (await res.json()) as T;
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`上游返回 ${res.status}`);
  return res.text();
}

const loaders: Record<HotSource, () => Promise<HotItem[]>> = {
  // 微博热搜：必须带 Referer，否则 403
  weibo: async () => {
    interface Res {
      data?: {
        realtime?: { word?: string; word_scheme?: string; num?: number }[];
      };
    }
    const j = await getJson<Res>("https://weibo.com/ajax/side/hotSearch", {
      Referer: "https://weibo.com/",
    });
    return (j.data?.realtime ?? []).slice(0, 30).map((x) => {
      const word = (x.word_scheme || x.word || "").trim();
      return {
        title: (x.word || "").trim(),
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(`#${word}#`)}`,
        hot: fmtHot(Number(x.num)),
      };
    });
  },

  toutiao: async () => {
    interface Res {
      data?: { Title?: string; Url?: string; HotValue?: string }[];
    }
    const j = await getJson<Res>(
      "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc",
    );
    return (j.data ?? []).slice(0, 30).map((x) => ({
      title: (x.Title ?? "").trim(),
      url: x.Url ?? "",
      hot: fmtHot(Number(x.HotValue)),
    }));
  },

  baidu: async () => {
    interface Item {
      word?: string;
      url?: string;
      hotScore?: string;
      desc?: string;
    }
    interface Res {
      data?: { cards?: { content?: { content?: Item[] }[] }[] };
    }
    const j = await getJson<Res>(
      "https://top.baidu.com/api/board?platform=wise&tab=realtime",
    );
    const items =
      j.data?.cards?.[0]?.content?.flatMap((c) => c.content ?? []) ?? [];
    return items.slice(0, 30).map((x) => ({
      title: (x.word ?? "").trim(),
      url: x.url ?? "",
      hot: fmtHot(Number(x.hotScore)),
      desc: x.desc?.trim(),
    }));
  },

  zhihu: async () => {
    interface Res {
      data?: {
        target?: { title?: string; url?: string; excerpt?: string };
        detail_text?: string;
      }[];
    }
    const j = await getJson<Res>(
      "https://api.zhihu.com/topstory/hot-lists/total?limit=30",
    );
    return (j.data ?? [])
      .map((x) => {
        const t = x.target ?? {};
        const url = (t.url ?? "").replace("api.zhihu.com", "www.zhihu.com");
        return {
          title: (t.title ?? "").trim(),
          url: url.replace("www.zhihu.com/questions", "www.zhihu.com/question"),
          hot: x.detail_text?.trim(),
          desc: t.excerpt?.trim(),
        };
      })
      .filter((x) => x.title)
      .slice(0, 30);
  },

  // X 没有免 key 的官方接口，抓 trends24 的全球热搜榜
  x: async () => {
    const html = await getText("https://trends24.in/");
    const start = html.indexOf("<ol");
    const end = html.indexOf("</ol>", start);
    if (start === -1 || end === -1) return [];
    const block = html.slice(start, end);
    const re = /<a href="([^"]+)" class=trend-link>([^<]+)<\/a>/g;
    const out: HotItem[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(block)) && out.length < 30) {
      out.push({
        title: decodeHtml(m[2].trim()),
        url: m[1].replace("twitter.com", "x.com"),
      });
    }
    return out;
  },

  reddit: async () => {
    interface Res {
      data?: {
        children?: {
          data?: {
            title?: string;
            permalink?: string;
            score?: number;
            subreddit?: string;
          };
        }[];
      };
    }
    const j = await getJson<Res>(
      "https://www.reddit.com/top.json?t=day&limit=30",
    );
    return (j.data?.children ?? [])
      .map((c) => c.data ?? {})
      .map((d) => ({
        title: (d.title ?? "").trim(),
        url: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
        hot: fmtHot(Number(d.score)),
        desc: d.subreddit ? `r/${d.subreddit}` : undefined,
      }))
      .filter((x) => x.title);
  },
};

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function GET(req: NextRequest) {
  const source = (req.nextUrl.searchParams.get("source") ?? "weibo") as HotSource;
  const loader = loaders[source];
  if (!loader) {
    return NextResponse.json({ error: "没有这个来源" }, { status: 400 });
  }

  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  const cached = cache.get(source);
  if (!fresh && cached && Date.now() - cached.at < CACHE_TTL) {
    return NextResponse.json({ items: cached.items });
  }

  try {
    const items = (await loader()).filter((i) => i.title && i.url);
    if (items.length === 0) throw new Error("没解析到内容");
    cache.set(source, { at: Date.now(), items });
    return NextResponse.json({ items });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `${LABELS[source]}暂时抓不到（${reason}）` },
      { status: 502 },
    );
  }
}
