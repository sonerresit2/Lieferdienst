"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { getProducts, getVendors } from "@/lib/api";
import type { Product, Vendor } from "@/lib/types";
import { deriveCategories } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";
import AuthModal from "@/components/auth/AuthModal";

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  useEffect(() => {
    getVendors().then(setVendors).catch(console.error);
    getProducts().then(setProducts).catch(console.error);
  }, []);

  const categories = useMemo(() => deriveCategories(products), [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchV = selectedVendor === null || p.vendor_id === selectedVendor;
        const matchC = selectedCategory === null || p.category === selectedCategory;
        return matchV && matchC;
      }),
    [products, selectedVendor, selectedCategory]
  );

  return (
    <main className="page">
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Lieferdienst</p>
        <h1 className={styles.heroTitle}>Gutes Essen,<br />direkt zu dir.</h1>
        <p className={styles.heroSub}>
          Frische Gerichte von lokalen Anbietern — einfach auswählen, in den Warenkorb, fertig.
        </p>
      </section>

      {/* Anbieter */}
      <div className={styles.vendorScroll}>
        <button
          className={`${styles.vendorChip} ${selectedVendor === null ? styles.vendorChipActive : ""}`}
          onClick={() => { setSelectedVendor(null); setSelectedCategory(null); }}
        >
          Alle
        </button>
        {vendors.map((v) => (
          <button
            key={v.id}
            className={`${styles.vendorChip} ${selectedVendor === v.id ? styles.vendorChipActive : ""}`}
            onClick={() => { setSelectedVendor(v.id); setSelectedCategory(null); }}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Kategorien */}
      {categories.length > 0 && (
        <nav className={styles.catRow}>
          <button
            className={`${styles.catTab} ${selectedCategory === null ? styles.catTabActive : ""}`}
            onClick={() => setSelectedCategory(null)}
          >Alle</button>
          {categories.map((c) => (
            <button
              key={c}
              className={`${styles.catTab} ${selectedCategory === c ? styles.catTabActive : ""}`}
              onClick={() => setSelectedCategory(c)}
            >{c}</button>
          ))}
        </nav>
      )}

      {/* Produkte */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>Keine Gerichte gefunden.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onNeedAuth={() => { setAuthTab("login"); setAuthOpen(true); }}
            />
          ))}
        </div>
      )}

      {authOpen && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setAuthOpen(false)}
          onSwitchTab={setAuthTab}
        />
      )}
    </main>
  );
}
