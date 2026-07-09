"use client";

import styles from "./ProductCard.module.css";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useReviews } from "@/lib/reviews-context";
import { useState } from "react";
import RatingStars from "@/components/shared/RatingStars";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  product: Product;
  onNeedAuth: () => void;
}

export default function ProductCard({ product, onNeedAuth }: Props) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { canReviewProduct, myProductReview, submitProductReview } = useReviews();
  const [adding, setAdding] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleRate(rating: number) {
    setSubmitting(true);
    try {
      await submitProductReview(product.id, rating);
      setRatingOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const myReview = myProductReview(product.id);
  const eligible = Boolean(user) && canReviewProduct(product.id);

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

        {(product.review_count > 0 || eligible) && (
          <div className={styles.ratingRow}>
            {product.review_count > 0 && (
              <RatingStars value={product.avg_rating} count={product.review_count} />
            )}
            {eligible && !ratingOpen && (
              <button type="button" className={styles.rateLink} onClick={() => setRatingOpen(true)}>
                {myReview ? "Bewertung ändern" : "Bewerten"}
              </button>
            )}
          </div>
        )}

        {ratingOpen && (
          <div className={styles.rateInput}>
            <RatingStars
              value={myReview?.rating ?? 0}
              interactive
              size="md"
              onChange={handleRate}
            />
            {submitting && <span className={styles.rateHint}>Speichere…</span>}
          </div>
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
