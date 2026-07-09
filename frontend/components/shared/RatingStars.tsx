"use client";

import { useState } from "react";
import styles from "./RatingStars.module.css";

interface Props {
  value: number | null;
  count?: number;
  interactive?: boolean;
  size?: "sm" | "md";
  onChange?: (rating: number) => void;
}

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function RatingStars({
  value,
  count,
  interactive = false,
  size = "sm",
  onChange,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value ?? 0;

  if (!interactive) {
    return (
      <span className={`${styles.row} ${styles[size]}`}>
        <span className={styles.stars} aria-hidden="true">
          {STAR_VALUES.map((n) => (
            <span key={n} className={n <= Math.round(displayValue) ? styles.filled : styles.empty}>
              ★
            </span>
          ))}
        </span>
        {value !== null ? (
          <span className={styles.text}>
            {value.toFixed(1)}
            {count !== undefined && <span className={styles.count}> ({count})</span>}
          </span>
        ) : (
          <span className={styles.text}>Noch keine Bewertungen</span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`${styles.row} ${styles[size]} ${styles.interactive}`}
      onMouseLeave={() => setHovered(null)}
    >
      <span className={styles.stars}>
        {STAR_VALUES.map((n) => (
          <button
            key={n}
            type="button"
            className={n <= displayValue ? styles.filled : styles.empty}
            onMouseEnter={() => setHovered(n)}
            onClick={() => onChange?.(n)}
            aria-label={`${n} von 5 Sternen`}
          >
            ★
          </button>
        ))}
      </span>
    </span>
  );
}
