import type { Product } from "./types";

export function formatPrice(amount: string | number): string {
  return Number(amount).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
  
}


export function deriveCategories(products: Product[]): string[] {
  const cats = new Set<string>();

  products.forEach((p) => {
    if (p.category) cats.add(p.category);
  });

  const order = [
    "Vorspeise",
    "Hauptgericht",
    "Beilage",
    "Nachtisch",
    "Bowl",
    "Getränk",
  ];

  const sorted = order.filter(category => cats.has(category));
  const remaining = Array.from(cats).filter(
    category => !order.includes(category)
  );

  return [...sorted, ...remaining];
}