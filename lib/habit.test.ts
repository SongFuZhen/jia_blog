import { describe, expect, it } from "vitest";
import {
  addDays,
  currentStreak,
  effectiveLog,
  last7Days,
  monthRange,
  summarizeRange,
  totalChecks,
  weekStartOf,
} from "./habit";
import type { GrowthItem } from "./types";

function habit(log: Record<string, "done" | "skip"> = {}): GrowthItem {
  return { id: "h", text: "晚上12点前睡觉", done: false, repeat: true, log };
}

describe("日期工具", () => {
  it("跨月加减", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("周一为一周起点（周日算上一周）", () => {
    expect(weekStartOf("2026-09-10")).toBe("2026-09-07"); // 周四
    expect(weekStartOf("2026-09-07")).toBe("2026-09-07"); // 周一
    expect(weekStartOf("2026-09-13")).toBe("2026-09-07"); // 周日
  });

  it("月首末日", () => {
    expect(monthRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});

describe("自动补记没做", () => {
  it("一次都没记过时什么都不知道", () => {
    expect(effectiveLog(habit(), "2026-09-10")).toEqual({});
  });

  it("上次打卡之后到昨天的空白天算没做，今天不算", () => {
    const log = effectiveLog(habit({ "2026-09-08": "done" }), "2026-09-10");
    expect(log["2026-09-08"]).toBe("done");
    expect(log["2026-09-09"]).toBe("skip");
    expect(log["2026-09-10"]).toBeUndefined(); // 今天还没过完
  });

  it("截止日之后的空白天不再算没做", () => {
    const item = { ...habit({ "2026-09-08": "done" }), due: "2026-09-08" };
    expect(effectiveLog(item, "2026-09-10")["2026-09-09"]).toBeUndefined();
  });

  it("手动记的没做会保留", () => {
    const log = effectiveLog(
      habit({ "2026-09-08": "done", "2026-09-09": "skip" }),
      "2026-09-10",
    );
    expect(log["2026-09-09"]).toBe("skip");
  });
});

describe("连续天数", () => {
  it("今天还没打卡时从昨天往前数", () => {
    const item = habit({
      "2026-09-08": "done",
      "2026-09-09": "done",
    });
    expect(currentStreak(item, "2026-09-10")).toBe(2);
  });

  it("今天记了没做就是断签", () => {
    const item = habit({
      "2026-09-08": "done",
      "2026-09-10": "skip",
    });
    expect(currentStreak(item, "2026-09-10")).toBe(0);
  });

  it("中间空一天会自动补成没做，连击断掉", () => {
    const item = habit({
      "2026-09-08": "done",
      "2026-09-10": "done",
    });
    expect(currentStreak(item, "2026-09-10")).toBe(1);
  });
});

describe("统计", () => {
  const item = habit({ "2026-09-07": "done", "2026-09-08": "skip" });

  it("只统计到今天，未开始记的日子和今天都不算", () => {
    const { from, to } = monthRange("2026-09");
    // 09-07 做了、09-08 没做、09-09 自动补没做；09-01~09-06 还没开始记
    expect(summarizeRange(item, from, to, "2026-09-10")).toEqual({
      done: 1,
      skip: 2,
      total: 3,
      rate: 33,
    });
  });

  it("未来区间返回 0", () => {
    expect(summarizeRange(item, "2026-10-01", "2026-10-31", "2026-09-10")).toEqual({
      done: 0,
      skip: 0,
      total: 0,
      rate: 0,
    });
  });

  it("累计次数 = 历史基线 + 日志里做了的天数", () => {
    expect(totalChecks({ ...item, cycleCount: 2 })).toBe(3);
  });
});

describe("圆点条", () => {
  it("最近 7 天含今天，未开始记的是 unknown", () => {
    const cells = last7Days(habit({ "2026-09-09": "done" }), "2026-09-10");
    expect(cells).toHaveLength(7);
    expect(cells[0].date).toBe("2026-09-04");
    expect(cells[0].state).toBe("unknown");
    expect(cells[5].state).toBe("done");
    expect(cells[6]).toEqual({ date: "2026-09-10", state: "pending" });
  });
});
