"use client";

import { useState } from "react";
import styles from "./CartPanel.module.css";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getImageSrc(imagePath: string) {
  return imagePath.startsWith("http") ? imagePath : `${API_URL}${imagePath}`;
}

interface Props { onClose: () => void; }

export default function CartPanel({ onClose }: Props) {
  const { user } = useAuth();
  const { cart, updateItem, removeItem, doCheckout } = useCart();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  async function handleCheckout() {
    setMessage(null);
    setLoading(true);
    try {
      const order = await doCheckout();
      setMessage({ text: `Bestellt! Gesamt: ${formatPrice(order.total_price)} ✓`, success: true });
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Fehler.", success: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Warenkorb</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">✕</button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛒</span>
            <p>Noch nichts im Warenkorb.</p>
            <p>Füge Gerichte aus der Karte hinzu.</p>
          </div>
        ) : (
          <div className={styles.items}>
            {items.map((item) => {
              const img = item.product.images.find(i => i.is_primary) ?? item.product.images[0];
              return (
                <div key={item.id} className={styles.line}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.lineImg} src={getImageSrc(img.image_path)} alt={item.product.name} />
                  ) : (
                    <div className={styles.lineImgPlaceholder}>🍽️</div>
                  )}
                  <div className={styles.lineInfo}>
                    <p className={styles.lineName}>{item.product.name}</p>
                    <p className={styles.linePrice}>{formatPrice(Number(item.product.price) * item.quantity)}</p>
                    <div className={styles.lineControls}>
                      <button className={styles.qtyBtn} onClick={() => updateItem(item.id, item.quantity - 1)}>−</button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
                      <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>Entfernen</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span>Zwischensumme</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.totalRowMain}`}>
            <span>Gesamt</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {!user ? (
            <p className={styles.authHint}>Bitte anmelden, um zu bestellen.</p>
          ) : (
            <button
              className="btn btn--primary btn--block"
              onClick={handleCheckout}
              disabled={items.length === 0 || loading}
            >
              {loading ? "Wird verarbeitet…" : "Bestellung aufgeben"}
            </button>
          )}

          {message && (
            <p className={`${styles.message} ${message.success ? styles.messageSuccess : ""}`}>
              {message.text}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
