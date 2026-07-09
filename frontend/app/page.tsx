"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { getProducts, getVendors } from "@/lib/api";
import type { Product, Vendor } from "@/lib/types";
import { deriveCategories, deriveDietaryTags, formatTagLabel } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";
import AuthModal from "@/components/auth/AuthModal";
import VendorRatingBar from "@/components/vendors/VendorRatingBar";

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([getVendors(), getProducts()])
      .then(([v, p]) => {
        setVendors(v);
        setProducts(p);
      })
      .catch(() => {
        setLoadError("Daten konnten nicht geladen werden. Bitte später erneut versuchen.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedVendorObj = useMemo(
    () => vendors.find((v) => v.id === selectedVendor) ?? null,
    [vendors, selectedVendor]
  );
  const categories = useMemo(() => deriveCategories(products), [products]);
  const dietaryTags = useMemo(() => deriveDietaryTags(products), [products]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchV = selectedVendor === null || p.vendor_id === selectedVendor;
        const matchC = selectedCategory === null || p.category === selectedCategory;
        const matchT = selectedTags.every((t) => p.dietary_tags.includes(t));
        return matchV && matchC && matchT;
      }),
    [products, selectedVendor, selectedCategory, selectedTags]
  );

  return (
    <main className="page">
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Lieferdienst</p>
        <h1 className={styles.heroTitle}>Weniger kochen.<br />Mehr genießen.</h1>
        <p className={styles.heroSub}>
          Kuratierte Gerichte lokaler Anbieter, geliefert in Minuten statt Stunden.
        </p>
      </section>

      {loadError ? (
        <p className={styles.empty}>{loadError}</p>
      ) : (
        <>
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

          {selectedVendorObj && <VendorRatingBar vendor={selectedVendorObj} />}

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

          {dietaryTags.length > 0 && (
            <div className={styles.tagRow}>
              {dietaryTags.map((t) => (
                <button
                  key={t}
                  className={`${styles.tagChip} ${selectedTags.includes(t) ? styles.tagChipActive : ""}`}
                  onClick={() => toggleTag(t)}
                  aria-pressed={selectedTags.includes(t)}
                >
                  {formatTagLabel(t)}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button className={styles.tagClear} onClick={() => setSelectedTags([])}>
                  Filter zurücksetzen
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
        </>
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
