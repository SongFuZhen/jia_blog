"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useHorizontalScroll } from "@/lib/use-horizontal-scroll";
import type { HotItem, HotSource } from "@/lib/types";

const sources: { key: HotSource; label: string }[] = [
  { key: "weibo", label: "微博热搜" },
  { key: "toutiao", label: "今日头条" },
  { key: "baidu", label: "百度热搜" },
  { key: "zhihu", label: "知乎热榜" },
  { key: "x", label: "X 热搜" },
  { key: "reddit", label: "Reddit" },
];

type State = { items: HotItem[]; error?: string };

function rankClass(i: number) {
  return i < 3 ? "text-[#F16D88]" : "text-ink-5";
}

function BottomSheet({
  item,
  onClose,
}: {
  item: HotItem;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    setShown(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center">
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[20px] bg-card shadow-2xl transition-transform duration-200 ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        <div className="flex items-start gap-2 border-b border-border-soft px-4 py-3">
          <h3 className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-ink">
            {item.title}
          </h3>
          <button
            type="button"
            onClick={close}
            aria-label="关闭"
            className="shrink-0 rounded-full p-1 text-ink-4 active:opacity-60"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {item.desc ? (
            <p className="text-[12.5px] leading-relaxed text-ink-2">
              {item.desc}
            </p>
          ) : null}
          {item.url ? (
            <iframe
              src={item.url}
              title={item.title}
              className="mt-3 h-[58vh] w-full rounded-[12px] border border-border-soft bg-white"
            />
          ) : null}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#F16D88] active:opacity-60"
            >
              打不开？在浏览器打开
              <ArrowUpRight className="size-3" strokeWidth={2} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const [active, setActive] = useState<HotSource>("weibo");
  const [data, setData] = useState<Partial<Record<HotSource, State>>>({});
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<HotItem | null>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  useHorizontalScroll(tabStripRef);

  const load = useCallback(async (source: HotSource, fresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hot?source=${source}${fresh ? "&fresh=1" : ""}`,
      );
      const json = (await res.json()) as { items?: HotItem[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? `抓取失败（${res.status}）`);
      setData((prev) => ({ ...prev, [source]: { items: json.items ?? [] } }));
    } catch (err) {
      setData((prev) => ({
        ...prev,
        [source]: {
          items: [],
          error: err instanceof Error ? err.message : "抓不到",
        },
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data[active]) load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, load]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  useEffect(() => {
    tabStripRef.current
      ?.querySelector(`[data-key="${active}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const current = data[active];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="看今朝" subtitle="今天外面都在聊什么" />

      <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden snap-x">
        {sources.map((s) => (
          <button
            key={s.key}
            data-key={s.key}
            onClick={() => setActive(s.key)}
            className={`shrink-0 snap-start rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              active === s.key
                ? "bg-[#F16D88] text-white"
                : "bg-white text-ink-3 shadow-[var(--shadow-xs)] dark:bg-[#2B2225]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[11.5px] text-ink-4">点开看，网页在弹窗里加载</p>
        <button
          onClick={() => load(active, true)}
          className="flex items-center gap-1 text-[11.5px] text-ink-4 active:opacity-60"
        >
          <RefreshCw
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            strokeWidth={2}
          />
          刷新
        </button>
      </div>

      {loading && !current ? (
        <div className="mt-6">
          <Loading />
        </div>
      ) : current?.error ? (
        <p className="mt-10 rounded-[16px] bg-card px-4 py-6 text-center text-[12.5px] text-ink-4 shadow-[var(--shadow-soft-sm)]">
          {current.error}
          <br />
          换一个源看看，或者过一会儿再刷新
        </p>
      ) : (
        <ol className="mt-1.5 divide-y divide-border-soft overflow-hidden rounded-[16px] bg-card shadow-[var(--shadow-soft-sm)]">
          {(current?.items ?? []).map((item, i) => (
            <li key={`${item.url}-${i}`}>
              <button
                type="button"
                onClick={() => setSheet(item)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left active:opacity-60"
              >
                <span
                  className={`w-4 shrink-0 text-center text-[11px] font-bold ${rankClass(i)}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                  {item.title}
                </span>
                {item.hot ? (
                  <span className="shrink-0 text-[11px] text-ink-4">
                    {item.hot}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
      )}

      {sheet ? (
        <BottomSheet item={sheet} onClose={() => setSheet(null)} />
      ) : null}
    </main>
  );
}
