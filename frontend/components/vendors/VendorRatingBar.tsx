"use client";

import { useState } from "react";
import styles from "./VendorRatingBar.module.css";
import type { Vendor } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useReviews } from "@/lib/reviews-context";
import RatingStars from "@/components/shared/RatingStars";

interface Props {
  vendor: Vendor;
}

export default function VendorRatingBar({ vendor }: Props) {
  const { user } = useAuth();
  const { canReviewVendor, myVendorReview, submitVendorReview } = useReviews();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myReview = myVendorReview(vendor.id);
  const eligible = Boolean(user) && canReviewVendor(vendor.id);

  async function handleRate(rating: number) {
    setSubmitting(true);
    try {
      await submitVendorReview(vendor.id, rating);
      setRatingOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span className={styles.name}>{vendor.name}</span>
        {vendor.review_count > 0 ? (
          <RatingStars value={vendor.avg_rating} count={vendor.review_count} size="md" />
        ) : (
          <span className={styles.noRating}>Noch keine Bewertungen</span>
        )}
        {vendor.delivery_time_min !== null && (
          <span className={styles.meta}>{vendor.delivery_time_min} Min. Lieferzeit</span>
        )}
      </div>

      {eligible && (
        <div className={styles.action}>
          {!ratingOpen ? (
            <button type="button" className={styles.rateBtn} onClick={() => setRatingOpen(true)}>
              {myReview ? "Bewertung ändern" : "Anbieter bewerten"}
            </button>
          ) : (
            <div className={styles.rateInput}>
              <RatingStars value={myReview?.rating ?? 0} interactive size="md" onChange={handleRate} />
              {submitting && <span className={styles.hint}>Speichere…</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
