import { create } from "zustand";
import {
  beautyTipsRepo,
  genId,
  productsRepo,
  usageLogsRepo,
  wishesRepo,
} from "@/lib/repository";
import type { BeautyTip, Product, UsageLog, Wish } from "@/lib/types";

type NewProduct = Omit<Product, "id"> & { id?: string };
type NewWish = Omit<Wish, "id"> & { id?: string };

interface BeautyState {
  tips: BeautyTip[];
  products: Product[];
  usageLogs: UsageLog[];
  wishes: Wish[];
  hydrated: boolean;
  hydrate: () => Promise<void>;

  /** 「我试过了」：记录尝试日期、效果星级、下次想调整的点 */
  markTried: (
    tipId: string,
    data: { triedAt: string; triedEffect: number; nextAdjust?: string },
  ) => Promise<void>;
  updateTip: (
    id: string,
    patch: Partial<Omit<BeautyTip, "id">>,
  ) => Promise<void>;

  addProduct: (data: NewProduct) => Promise<void>;
  updateProduct: (
    id: string,
    patch: Partial<Omit<Product, "id">>,
  ) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  /** 使用打卡：今天用了某个产品 */
  logUsage: (productId: string, date?: string) => Promise<void>;

  addWish: (data: NewWish) => Promise<void>;
  /** 状态流转：想买 → 已购买 → 已使用 → 不推荐 */
  updateWish: (
    id: string,
    patch: Partial<Omit<Wish, "id">>,
  ) => Promise<void>;
  removeWish: (id: string) => Promise<void>;
}

export const useBeautyStore = create<BeautyState>((set, get) => ({
  tips: [],
  products: [],
  usageLogs: [],
  wishes: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const [tips, products, usageLogs, wishes] = await Promise.all([
      beautyTipsRepo.list(),
      productsRepo.list(),
      usageLogsRepo.list(),
      wishesRepo.list(),
    ]);
    set({ tips, products, usageLogs, wishes, hydrated: true });
  },

  markTried: async (tipId, data) => {
    await get().updateTip(tipId, data);
  },

  updateTip: async (id, patch) => {
    const prev = get().tips;
    set({ tips: prev.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
    try {
      const updated = await beautyTipsRepo.update(id, patch);
      if (updated) {
        set({ tips: get().tips.map((t) => (t.id === id ? updated : t)) });
      }
    } catch (err) {
      set({ tips: prev });
      throw err;
    }
  },

  addProduct: async (data) => {
    const product: Product = { ...data, id: data.id ?? genId() } as Product;
    const prev = get().products;
    set({ products: [product, ...prev] });
    try {
      await productsRepo.create(product);
    } catch (err) {
      set({ products: prev });
      throw err;
    }
  },

  updateProduct: async (id, patch) => {
    const prev = get().products;
    set({ products: prev.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    try {
      const updated = await productsRepo.update(id, patch);
      if (updated) {
        set({ products: get().products.map((p) => (p.id === id ? updated : p)) });
      }
    } catch (err) {
      set({ products: prev });
      throw err;
    }
  },

  removeProduct: async (id) => {
    const prevProducts = get().products;
    const prevLogs = get().usageLogs;
    set({
      products: prevProducts.filter((p) => p.id !== id),
      usageLogs: prevLogs.filter((u) => u.productId !== id),
    });
    try {
      await productsRepo.remove(id);
      // 关联打卡记录后台清理，失败不影响界面
      for (const log of prevLogs.filter((u) => u.productId === id)) {
        usageLogsRepo.remove(log.id).catch(() => {});
      }
    } catch (err) {
      set({ products: prevProducts, usageLogs: prevLogs });
      throw err;
    }
  },

  logUsage: async (productId, date) => {
    const log: UsageLog = {
      id: genId(),
      productId,
      date: date ?? new Date().toISOString().slice(0, 10),
    };
    const prev = get().usageLogs;
    set({ usageLogs: [log, ...prev] });
    try {
      await usageLogsRepo.create(log);
    } catch (err) {
      set({ usageLogs: prev });
      throw err;
    }
  },

  addWish: async (data) => {
    const wish: Wish = { ...data, id: data.id ?? genId() } as Wish;
    const prev = get().wishes;
    set({ wishes: [wish, ...prev] });
    try {
      await wishesRepo.create(wish);
    } catch (err) {
      set({ wishes: prev });
      throw err;
    }
  },

  updateWish: async (id, patch) => {
    const prev = get().wishes;
    set({ wishes: prev.map((w) => (w.id === id ? { ...w, ...patch } : w)) });
    try {
      const updated = await wishesRepo.update(id, patch);
      if (updated) {
        set({ wishes: get().wishes.map((w) => (w.id === id ? updated : w)) });
      }
    } catch (err) {
      set({ wishes: prev });
      throw err;
    }
  },

  removeWish: async (id) => {
    const prev = get().wishes;
    set({ wishes: prev.filter((w) => w.id !== id) });
    try {
      await wishesRepo.remove(id);
    } catch (err) {
      set({ wishes: prev });
      throw err;
    }
  },
}));
