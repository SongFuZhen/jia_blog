import { useEffect, type RefObject } from "react";

/**
 * 让横向滚动容器支持「鼠标滚轮纵向 → 横向」滚动。
 * 到达两端时把事件交还页面，避免吞掉纵向滚动。
 * 把返回的 ref 绑到 overflow-x-auto 的容器即可；移动端原本就能手指横滑，这里主要补桌面端。
 */
export function useHorizontalScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const node: T = el;

    function onWheel(e: WheelEvent) {
      // 本来就是横向滚轮（带 shift 等）不拦截
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const canScroll = node.scrollWidth > node.clientWidth + 1;
      if (!canScroll) return;
      const atStart = node.scrollLeft <= 0;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
      // 到边缘放手，让页面继续纵向滚动
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      node.scrollLeft += e.deltaY;
      e.preventDefault();
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [ref]);
}
