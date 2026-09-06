import { create } from "zustand";
import {
  beautyTipsRepo,
  productsRepo,
  usageLogsRepo,
  wishesRepo,
} from "@/lib/repository";
import type { BeautyTip, Product, UsageLog, Wish } from "@/lib/types";

type NewProduct = Parameters<typeof productsRepo.create>[0];
type NewWish = Parameters<typeof wishesRepo.create>[0];

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

  addProduct: (data: NewProduct) => Promise<Product>;
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
    const updated = await beautyTipsRepo.update(id, patch);
    if (!updated) return;
    set((s) => ({
      tips: s.tips.map((t) => (t.id === id ? updated : t)),
    }));
  },

  addProduct: async (data) => {
    const product = await productsRepo.create(data);
    set((s) => ({ products: [product, ...s.products] }));
    return product;
  },

  updateProduct: async (id, patch) => {
    const updated = await productsRepo.update(id, patch);
    if (!updated) return;
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  removeProduct: async (id) => {
    await productsRepo.remove(id);
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
      usageLogs: s.usageLogs.filter((u) => u.productId !== id),
    }));
  },

  logUsage: async (productId, date) => {
    const log = await usageLogsRepo.create({
      productId,
      date: date ?? new Date().toISOString().slice(0, 10),
    });
    set((s) => ({ usageLogs: [log, ...s.usageLogs] }));
  },

  addWish: async (data) => {
    const wish = await wishesRepo.create(data);
    set((s) => ({ wishes: [wish, ...s.wishes] }));
  },

  updateWish: async (id, patch) => {
    const updated = await wishesRepo.update(id, patch);
    if (!updated) return;
    set((s) => ({
      wishes: s.wishes.map((w) => (w.id === id ? updated : w)),
    }));
  },

  removeWish: async (id) => {
    await wishesRepo.remove(id);
    set((s) => ({ wishes: s.wishes.filter((w) => w.id !== id) }));
  },
}));
