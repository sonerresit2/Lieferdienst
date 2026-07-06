"use client";
import { useEffect, useState } from "react";
import styles from "./CookieBanner.module.css";

const STORAGE_KEY = "lieferdienst_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function handleChoice(choice: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        Wir verwenden ausschließlich technisch notwendige Speicherung (z. B. für Ihren Login).
        Es findet kein Tracking und keine Analyse-Cookies statt. Mehr dazu in unserer{" "}
        <a href="/datenschutz" className={styles.link}>Datenschutzerklärung</a>.
      </p>
      <div className={styles.actions}>
        <button className={styles.decline} onClick={() => handleChoice("declined")}>
          Ablehnen
        </button>
        <button className={styles.accept} onClick={() => handleChoice("accepted")}>
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
