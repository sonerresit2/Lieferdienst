import type { Product } from "./types";

export function formatPrice(amount: string | number): string {
  return Number(amount).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

export function deriveCategories(products: Product[]): string[] {
  const cats = new Set<string>();
  products.forEach((p) => { if (p.category) cats.add(p.category); });
  return Array.from(cats).sort();
}
