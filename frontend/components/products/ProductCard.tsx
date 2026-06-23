"use client";

import styles from "./ProductCard.module.css";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  product: Product;
  onNeedAuth: () => void;
}

export default function ProductCard({ product, onNeedAuth }: Props) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const primaryImage =
    product.images.find((i) => i.is_primary) ?? product.images[0];

  // Bild-URL: wenn der Pfad mit http startet (externe URL wie Picsum),
  // direkt nutzen. Sonst Backend-URL voranstellen (hochgeladene Bilder).
  const imageSrc = primaryImage
    ? primaryImage.image_path.startsWith("http")
      ? primaryImage.image_path
      : `${API_URL}${primaryImage.image_path}`
    : null;

  async function handleAdd() {
    if (!user) { onNeedAuth(); return; }
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={product.name} loading="lazy" />
        ) : (
          <span>🍽️</span>
        )}
        {product.category && (
          <span className={styles.badge}>{product.category}</span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.name}>{product.name}</p>
        {product.description && (
          <p className={styles.desc}>{product.description}</p>
        )}
        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={!product.is_available || adding}
          >
            {adding ? "…" : product.is_available ? "Hinzufügen" : "Ausverkauft"}
          </button>
        </div>
      </div>
    </article>
  );
}
