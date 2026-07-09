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

export function deriveDietaryTags(products: Product[]): string[] {
  const tags = new Set<string>();
  products.forEach((p) => p.dietary_tags.forEach((t) => tags.add(t)));

  const order = ["vegan", "vegetarisch", "glutenfrei", "laktosefrei", "nussfrei"];
  const sorted = order.filter((t) => tags.has(t));
  const remaining = Array.from(tags).filter((t) => !order.includes(t));

  return [...sorted, ...remaining];
}

export function formatTagLabel(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}
