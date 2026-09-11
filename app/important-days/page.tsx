"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHorizontalScroll } from "@/lib/use-horizontal-scroll";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { Sheet } from "@/components/sheet";
import { useConfirm } from "@/lib/stores/confirm";
import { useImportantDaysStore } from "@/lib/stores/important-days";
import {
  getUserUpcoming,
  getHolidayUpcoming,
  getSolarTermUpcoming,
  jieqiImage,
  auditImportantDays,
  weekdayLabel,
} from "@/lib/important-days";
import { lunarToSolar, solarToLunarLabel } from "@/lib/lunar";
import type {
  DayIssue,
  ImportantDay,
  ImportantDayKind,
  UpcomingEvent,
} from "@/lib/important-days";

const KIND_LABEL: Record<ImportantDayKind, string> = {
  festival: "节日",
  birthday: "生日",
  anniversary: "纪念日",
  custom: "自定义",
};
const KINDS: ImportantDayKind[] = ["birthday", "anniversary", "festival", "custom"];

const TABS = [
  { key: "own", label: "自己的" },
  { key: "holiday", label: "节假日" },
  { key: "term", label: "二十四节气" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 按下一次发生阳历日期的月份分组（跨年带年份） */
function groupByMonth(events: UpcomingEvent[]) {
  const thisYear = new Date().getFullYear();
  const map = new Map<string, { label: string; items: UpcomingEvent[] }>();
  for (const e of events) {
    const [y, m] = e.date.split("-");
    const key = `${y}-${m}`;
    const label = Number(y) === thisYear ? `${Number(m)}月` : `${y}年${Number(m)}月`;
    if (!map.has(key)) map.set(key, { label, items: [] });
    map.get(key)!.items.push(e);
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v }));
}

export default function ImportantDaysPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalScroll(scrollRef);
  const days = useImportantDaysStore((s) => s.days);
  const hydrated = useImportantDaysStore((s) => s.hydrated);
  const hydrate = useImportantDaysStore((s) => s.hydrate);
  const add = useImportantDaysStore((s) => s.add);
  const update = useImportantDaysStore((s) => s.update);
  const remove = useImportantDaysStore((s) => s.remove);
  const confirm = useConfirm();

  const [tab, setTab] = useState<TabKey>("own");
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [issues, setIssues] = useState<DayIssue[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ImportantDay, "id">>({
    name: "",
    kind: "birthday",
    isLunar: false,
    month: 1,
    day: 1,
    emoji: "",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const lunarPreview = useMemo(() => {
    if (!form.isLunar) return null;
    const y = new Date().getFullYear();
    let s = lunarToSolar(y, form.month, form.day);
    let note = "";
    if (!s && form.day === 30) {
      s = lunarToSolar(y, form.month + 1, 1);
      note = "（当年无此日，已顺延到下月初一）";
    }
    if (!s) return { text: "该农历日当年不存在", note: "" };
    const date = new Date(s.year, s.month - 1, s.day);
    return {
      text: `今年对应 ${s.year}年${pad(s.month)}月${pad(s.day)}日 · ${solarToLunarLabel(date)}`,
      note,
    };
  }, [form.isLunar, form.month, form.day]);

  function startAdd() {
    setForm({ name: "", kind: "birthday", isLunar: false, month: 1, day: 1, emoji: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(d: ImportantDay) {
    const { id: _id, ...rest } = d;
    setForm(rest);
    setEditingId(d.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const data: Omit<ImportantDay, "id"> = {
      name: form.name.trim(),
      kind: form.kind,
      isLunar: form.isLunar,
      month: Math.min(12, Math.max(1, form.month || 1)),
      day: Math.min(30, Math.max(1, form.day || 1)),
      emoji: form.emoji?.trim() || undefined,
    };
    if (editingId) await update(editingId, data);
    else await add(data);
    setShowForm(false);
    setEditingId(null);
  }

  async function handleRemove(id: string) {
    if (await confirm({ title: "删除这个日子？", danger: true })) remove(id);
  }

  const ownGroups = useMemo(
    () => groupByMonth(getUserUpcoming(days)),
    [days],
  );
  const holidayGroups = useMemo(() => groupByMonth(getHolidayUpcoming()), []);
  const termGroups = useMemo(() => groupByMonth(getSolarTermUpcoming()), []);

  function renderRow(e: UpcomingEvent, editable: boolean, image?: string) {
    const d = editable ? days.find((x) => x.id === e.id) : undefined;
    return (
      <div
        key={`${e.id}-${e.date}`}
        onClick={editable && d ? () => startEdit(d) : undefined}
        className={`flex items-center gap-3 rounded-[16px] bg-card p-3.5 shadow-[var(--shadow-soft-sm)] ${
          editable ? "active:opacity-60" : ""
        }`}
      >
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-soft text-[18px]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={e.name}
              className="h-full w-full object-cover"
            />
          ) : (
            e.emoji
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[14.5px] font-semibold text-ink">{e.name}</p>
            {editable ? (
              <span className="shrink-0 rounded-full bg-cream px-2 py-[2px] text-[10.5px] text-ink-3">
                {KIND_LABEL[e.kind]}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11.5px] text-ink-4">
            {e.date.slice(5)} {weekdayLabel(e.date)}
            {e.lunar ? ` · ${e.lunar}` : ""}
            {e.isLunar ? " · 农历" : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-pink-soft px-2.5 py-1 text-[12px] font-semibold text-[#E0697E]">
          {e.daysUntil === 0 ? "今天" : `${e.daysUntil}天`}
        </span>
        {editable && d ? (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              handleRemove(e.id);
            }}
            aria-label="删除"
            className="shrink-0 text-ink-5 active:opacity-60"
          >
            <Trash2 className="size-3.5" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
    );
  }

  if (!hydrated) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
        <PageHeader
          title="重要日子"
          subtitle="每一年的重要时刻"
          action={
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              加一个
            </button>
          }
        />
        <Loading />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader
        title="重要日子"
        subtitle="每一年的重要时刻"
        action={
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            加一个
          </button>
        }
      />

      {/* 三类切换 */}
      <div ref={scrollRef} className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden snap-x">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 snap-start rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
              tab === t.key
                ? "bg-[#F16D88] text-white"
                : "bg-white text-ink-3 shadow-[var(--shadow-xs)] dark:bg-[#2B2225]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 自己的 */}
      {tab === "own" && (
        <div className="mt-4 space-y-2">
          <button
            onClick={() => setIssues(auditImportantDays(days))}
            className="flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-cream py-2.5 text-[12.5px] font-medium text-ink-3 active:opacity-60"
          >
            <ShieldCheck className="size-4" strokeWidth={1.8} />
            核对一遍日子
          </button>
          {issues !== null && (
            <div className="mt-1 rounded-[16px] bg-card p-3.5 shadow-[var(--shadow-soft-sm)]">
              {issues.length === 0 ? (
                <p className="text-[12.5px] text-ink-2">
                  核对完啦，没有算错、重复或缺失的日子
                </p>
              ) : (
                <ul className="space-y-2">
                  {issues.map((it, i) => (
                    <li key={i}>
                      <button
                        onClick={() => {
                          const d = days.find((x) => x.id === it.ids[0]);
                          if (d) startEdit(d);
                        }}
                        className="flex w-full gap-2 text-left active:opacity-60"
                      >
                        <span
                          className={`shrink-0 text-[12px] ${
                            it.level === "error" ? "text-[#E5484D]" : "text-[#B5791F]"
                          }`}
                        >
                          ●
                        </span>
                        <span className="text-[12.5px] leading-snug text-ink-2">
                          {it.message}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] text-ink-5">点问题可以直接改这条日子</p>
            </div>
          )}

          {days.length === 0 ? (
            <p className="mt-10 text-center text-[13px] text-ink-4">
              还没有重要日子，点下面的 ＋ 加一个吧
            </p>
          ) : (
            ownGroups.map((g) => (
              <div key={g.key} className="space-y-2">
                <button
                  onClick={() =>
                    setCollapsed((cur) =>
                      cur.includes(g.key)
                        ? cur.filter((k) => k !== g.key)
                        : [...cur, g.key],
                    )
                  }
                  className="mt-3 flex w-full items-center gap-1.5 px-1 text-left active:opacity-60"
                >
                  {collapsed.includes(g.key) ? (
                    <ChevronRight className="size-3.5 text-ink-4" strokeWidth={2.2} />
                  ) : (
                    <ChevronDown className="size-3.5 text-ink-4" strokeWidth={2.2} />
                  )}
                  <span className="text-[12px] font-medium text-ink-4">{g.label}</span>
                  <span className="text-[11px] text-ink-5">{g.items.length}</span>
                </button>
                {!collapsed.includes(g.key) &&
                  g.items.map((e) => renderRow(e, true))}
              </div>
            ))
          )}
        </div>
      )}

      {/* 节假日（只读） */}
      {tab === "holiday" && (
        <div className="mt-4 space-y-2">
          {holidayGroups.length === 0 ? (
            <p className="mt-10 text-center text-[13px] text-ink-4">暂无节假日</p>
          ) : (
            holidayGroups.map((g) => (
              <div key={g.key} className="space-y-2">
                <p className="mt-3 px-1 text-[12px] font-medium text-ink-4">{g.label}</p>
                {g.items.map((e) => renderRow(e, false))}
              </div>
            ))
          )}
        </div>
      )}

      {/* 二十四节气（只读） */}
      {tab === "term" && (
        <div className="mt-4 space-y-2">
          {termGroups.length === 0 ? (
            <p className="mt-10 text-center text-[13px] text-ink-4">暂无节气</p>
          ) : (
            termGroups.map((g) => (
              <div key={g.key} className="space-y-2">
                <p className="mt-3 px-1 text-[12px] font-medium text-ink-4">{g.label}</p>
                {g.items.map((e) => renderRow(e, false, jieqiImage(e.name)))}
              </div>
            ))
          )}
        </div>
      )}

      {/* 新增 / 编辑表单（底部抽屉） */}
      {showForm && (
        <Sheet
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          title={editingId ? "编辑日子" : "加一个重要日子"}
        >
          <div className="space-y-3 pb-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="名称，如：小佳佳生日"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setForm({ ...form, kind: k })}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                    form.kind === k
                      ? "bg-pink-soft font-medium text-[#E0697E]"
                      : "bg-cream text-ink-3"
                  }`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setForm({ ...form, isLunar: !form.isLunar })}
              className="flex w-full items-center justify-between rounded-[12px] bg-field px-3 py-2.5"
            >
              <span className="flex items-center gap-1.5 text-[13px] text-ink">
                <CalendarDays className="size-4 text-ink-3" strokeWidth={1.8} />
                按农历记录
              </span>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  form.isLunar ? "bg-[#E96882]" : "bg-[#E2D4D8]"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                    form.isLunar ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                className="w-20 rounded-[12px] bg-field px-3 py-2 text-[13px] text-ink outline-none"
              />
              <span className="text-[13px] text-ink-3">月</span>
              <input
                type="number"
                min={1}
                max={30}
                value={form.day}
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
                className="w-20 rounded-[12px] bg-field px-3 py-2 text-[13px] text-ink outline-none"
              />
              <span className="text-[13px] text-ink-3">日</span>
            </div>

            {lunarPreview && (
              <p className="text-[12px] text-ink-4">
                {lunarPreview.text}
                {lunarPreview.note && (
                  <span className="text-[#B5791F]"> {lunarPreview.note}</span>
                )}
              </p>
            )}

            <input
              value={form.emoji ?? ""}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="emoji，如 🎂（可选）"
              className="w-32 rounded-[12px] bg-field px-3 py-2 text-[14px] text-ink outline-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="rounded-full bg-cream px-4 py-1.5 text-[12.5px] text-ink-3"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="rounded-full bg-[#E96882] px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-40"
              >
                {editingId ? "保存" : "添加"}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </main>
  );
}
