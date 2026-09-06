import { create } from "zustand";
import {
  beautyTipsRepo,
  productsRepo,
  usageLogsRepo,
} from "@/lib/repository";
import type { BeautyTip, Product, UsageLog } from "@/lib/types";

type NewProduct = Parameters<typeof productsRepo.create>[0];

interface BeautyState {
  tips: BeautyTip[];
  products: Product[];
  usageLogs: UsageLog[];
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
}

export const useBeautyStore = create<BeautyState>((set, get) => ({
  tips: [],
  products: [],
  usageLogs: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const [tips, products, usageLogs] = await Promise.all([
      beautyTipsRepo.list(),
      productsRepo.list(),
      usageLogsRepo.list(),
    ]);
    set({ tips, products, usageLogs, hydrated: true });
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
}));
