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

  const [language, setLanguage] = useState("DE");

  const [translations, setTranslations] = useState({
    heroEyebrow: "Lieferdienst",
    heroTitle: "Weniger kochen. Mehr genießen.",
    heroSub:
      "Kuratierte Gerichte lokaler Anbieter, geliefert in Minuten statt Stunden.",

    all: "Alle",
    resetFilter: "Filter zurücksetzen",
    noProducts: "Keine Gerichte gefunden",
  });

    const [translatedCategories, setTranslatedCategories] = useState<
    Record<string, string>
  >({});

  const [translatedVendors, setTranslatedVendors] = useState<
    Record<number, string>
  >({});

  const [translatedTags, setTranslatedTags] = useState<
    Record<string, string>
  >({});

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

  const translatePage = async (lang: string) => {
  if (lang === "DE") {
    setTranslations({
      heroEyebrow: "Lieferdienst",
      heroTitle: "Weniger kochen. Mehr genießen.",
      heroSub:
        "Kuratierte Gerichte lokaler Anbieter, geliefert in Minuten statt Stunden.",

      all: "Alle",
      resetFilter: "Filter zurücksetzen",
      noProducts: "Keine Gerichte gefunden",
    });

    setTranslatedCategories({});
    setTranslatedVendors({});
    setTranslatedTags({});

    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/translate/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: [
            "Lieferdienst",
            "Weniger kochen. Mehr genießen.",
            "Kuratierte Gerichte lokaler Anbieter, geliefert in Minuten statt Stunden.",
            "Alle",
            "Filter zurücksetzen",
            "Keine Gerichte gefunden",
          ],
          target_lang: lang,
        }),
      }
    );

    const data = await response.json();

    if (!data.translations) {
      console.error("Keine Übersetzungen erhalten:", data);
      return;
    }

    setTranslations({
      heroEyebrow: data.translations[0],
      heroTitle: data.translations[1],
      heroSub: data.translations[2],

      all: data.translations[3],
      resetFilter: data.translations[4],
      noProducts: data.translations[5],
    });

    // Kategorien übersetzen
    if (categories.length > 0) {
      const categoryResponse = await fetch(
        "http://localhost:8000/translate/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: categories,
            target_lang: lang,
          }),
        }
      );

            // Tags übersetzen
      if (dietaryTags.length > 0) {
        const tagResponse = await fetch(
          "http://localhost:8000/translate/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              texts: dietaryTags.map((tag) => formatTagLabel(tag)),
              target_lang: lang,
            }),
          }
        );

        const tagData = await tagResponse.json();

        const tagMap: Record<string, string> = {};

        dietaryTags.forEach((tag, index) => {
          tagMap[tag] =
            tagData.translations?.[index] ?? formatTagLabel(tag);
        });

        setTranslatedTags(tagMap);
      }

      const categoryData = await categoryResponse.json();

      const categoryMap: Record<string, string> = {};

      categories.forEach((category, index) => {
        categoryMap[category] =
          categoryData.translations?.[index] ?? category;
      });

      setTranslatedCategories(categoryMap);
    }

    // Anbieter übersetzen
    if (vendors.length > 0) {
      const vendorNames = vendors.map((v) => v.name);

      const vendorResponse = await fetch(
        "http://localhost:8000/translate/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: vendorNames,
            target_lang: lang,
          }),
        }
      );

      const vendorData = await vendorResponse.json();

      const vendorMap: Record<number, string> = {};

      vendors.forEach((vendor, index) => {
        vendorMap[vendor.id] =
          vendorData.translations?.[index] ?? vendor.name;
      });

      setTranslatedVendors(vendorMap);
    }
  } catch (error) {
    console.error("Translation Error:", error);
  }
};
  const selectedVendorObj = useMemo(
  () => vendors.find((v) => v.id === selectedVendor) ?? null,
  [vendors, selectedVendor]
);

const categories = useMemo(
  () => deriveCategories(products),
  [products]
);

const dietaryTags = useMemo(
  () => deriveDietaryTags(products),
  [products]
);

function toggleTag(tag: string) {
  setSelectedTags((prev) =>
    prev.includes(tag)
      ? prev.filter((t) => t !== tag)
      : [...prev, tag]
  );
}

useEffect(() => {
  console.log("Produkte:", products.length);
  console.log("Kategorien:", categories);
  console.log("Tags:", dietaryTags);
}, [products, categories, dietaryTags]);

  const filtered = useMemo(
  () =>
    products.filter((p) => {
      const matchV =
        selectedVendor === null ||
        p.vendor_id === selectedVendor;

      const matchC =
        selectedCategory === null ||
        p.category === selectedCategory;

      const matchT =
        selectedTags.every((t) =>
          p.dietary_tags.includes(t)
        );

      return matchV && matchC && matchT;
    }),
  [products, selectedVendor, selectedCategory, selectedTags]
);

  return (
    <main className="page">
        <div style={{ marginBottom: "20px" }}>
          <select
            value={language}
            onChange={(e) => {
              const lang = e.target.value;
              setLanguage(lang);
              translatePage(lang);
            }}
          >
            <option value="DE">Deutsch</option>
            <option value="EN-US">English</option>
            <option value="FR">Français</option>
            <option value="IT">Italiano</option>
          </select>
      </div>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>
          {translations.heroEyebrow}
        </p>

        <h1 className={styles.heroTitle}>
          {translations.heroTitle}
        </h1>

        <p className={styles.heroSub}>
          {translations.heroSub}
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
              {translations.all}
            </button>
            {vendors.map((v) => (
              <button
                key={v.id}
                className={`${styles.vendorChip} ${selectedVendor === v.id ? styles.vendorChipActive : ""}`}
                onClick={() => { setSelectedVendor(v.id); setSelectedCategory(null); }}
              >
                {translatedVendors[v.id] ?? v.name}
              </button>
            ))}
          </div>

          {selectedVendorObj && <VendorRatingBar vendor={selectedVendorObj} />}

          {categories.length > 0 && (
            <nav className={styles.catRow}>
              <button
                className={`${styles.catTab} ${selectedCategory === null ? styles.catTabActive : ""}`}
                onClick={() => setSelectedCategory(null)}
              >{translations.all}</button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`${styles.catTab} ${selectedCategory === c ? styles.catTabActive : ""}`}
                  onClick={() => setSelectedCategory(c)}
                >{translatedCategories[c] ?? c}</button>
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
                  {translatedTags[t] ?? formatTagLabel(t)}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button className={styles.tagClear} onClick={() => setSelectedTags([])}>
                  {translations.resetFilter}
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
            <p className={styles.empty}>{translations.noProducts}</p>
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
