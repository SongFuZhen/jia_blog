import type { DayCell } from "@/lib/habit";

const COLORS: Record<DayCell["state"], string> = {
  done: "bg-[#F16D88]",
  skip: "bg-[#E5484D]/60",
  pending: "border border-toggle-off",
  unknown: "bg-border-soft",
};

/** 打卡圆点条：粉=做了，红=没做，空心=今天还没记，浅灰=还没开始记 */
export function HabitDots({
  cells,
  today,
  title,
}: {
  cells: DayCell[];
  today: string;
  title?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      {cells.map((c) => (
        <span
          key={c.date}
          className={`size-2 rounded-full ${COLORS[c.state]} ${
            c.date === today ? "ring-1 ring-[#F16D88]/40" : ""
          }`}
        />
      ))}
    </span>
  );
}
