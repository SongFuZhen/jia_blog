import { describe, expect, it } from "vitest";
import {
  getGreeting,
  getSurprise,
  greetingsByWeekday,
  pickByDate,
  surprises,
} from "./surprises";

describe("pickByDate", () => {
  const list = ["a", "b", "c"];

  it("返回值一定来自列表本身", () => {
    for (const key of ["2026-9-7", "2026-9-8", "abc", "今天", "anniversary"]) {
      expect(list).toContain(pickByDate(list, key));
    }
  });

  it("同一个 key 结果稳定（确定性随机，同一天不变）", () => {
    for (const key of ["2026-1-1", "x", "纪念日晚餐", "2026-9-7"]) {
      expect(pickByDate(list, key)).toBe(pickByDate(list, key));
    }
  });

  it("key 变化时会轮换，不是永远同一句", () => {
    const picked = new Set<string>();
    for (let i = 0; i < 50; i++) picked.add(pickByDate(list, `day-${i}`));
    expect(picked.size).toBeGreaterThan(1);
  });

  it("key 足够多时能覆盖列表所有元素（分布均匀性）", () => {
    const picked = new Set<string>();
    for (let i = 0; i < 300; i++) picked.add(pickByDate(list, `key-${i}`));
    expect([...picked].sort()).toEqual([...list].sort());
  });

  it("中文字符串作为 key 不炸且稳定", () => {
    expect(pickByDate(list, "周一")).toBe(pickByDate(list, "周一"));
  });
});

describe("pickByDate 的实际使用", () => {
  it("getGreeting：星期 label 与问候语按东八区日期取值", () => {
    // 2026-09-07 是周一
    const g = getGreeting(new Date("2026-09-07T12:00:00+08:00"));
    expect(g.label).toBe("周一");
    expect(greetingsByWeekday[1].slice(1)).toContain(g.text);
  });

  it("getGreeting：同一天多次调用结果一致", () => {
    const a = getGreeting(new Date("2026-09-07T00:30:00+08:00"));
    const b = getGreeting(new Date("2026-09-07T23:30:00+08:00"));
    expect(a).toEqual(b);
  });

  it("getSurprise：普通日期返回文案库里的句子", () => {
    const s = getSurprise(new Date("2026-09-07T12:00:00+08:00"));
    expect(s.isAnniversary).toBe(false);
    expect(surprises).toContain(s.text);
  });

  it("getSurprise：命中纪念日（10-07）时返回纪念语文案", () => {
    const s = getSurprise(new Date("2026-10-07T12:00:00+08:00"));
    expect(s.isAnniversary).toBe(true);
    expect(s.text).toContain("在一起纪念日");
  });
});
