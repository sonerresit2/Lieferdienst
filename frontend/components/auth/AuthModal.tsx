"use client";

import { useState } from "react";
import styles from "./AuthModal.module.css";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { register } from "@/lib/api";

interface Props {
  initialTab: "login" | "register";
  onClose: () => void;
  onSwitchTab: (tab: "login" | "register") => void;
}

export default function AuthModal({ initialTab, onClose, onSwitchTab }: Props) {
  const { login } = useAuth();
  const { reload } = useCart();
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(t: "login" | "register") {
    setTab(t);
    setError("");
    onSwitchTab(t);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(fd.get("email") as string, fd.get("password") as string);
      await reload();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await register({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        full_name: fd.get("full_name") as string,
      });
      await login(fd.get("email") as string, fd.get("password") as string);
      await reload();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registrierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Schließen">✕</button>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => switchTab("login")}
          >
            Anmelden
          </button>
          <button
            className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`}
            onClick={() => switchTab("register")}
          >
            Registrieren
          </button>
        </div>

        <h2 className={styles.title}>
          {tab === "login" ? "Willkommen zurück" : "Konto erstellen"}
        </h2>

        {tab === "login" ? (
          <form className={styles.form} onSubmit={handleLogin}>
            <label className={styles.field}>
              <span className={styles.label}>E-Mail</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Passwort</span>
              <input type="password" name="password" required autoComplete="current-password" />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? "Wird angemeldet…" : "Anmelden"}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRegister}>
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input type="text" name="full_name" required autoComplete="name" />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>E-Mail</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Passwort</span>
              <input type="password" name="password" required minLength={8} autoComplete="new-password" />
              <span className={styles.hint}>Mindestens 8 Zeichen</span>
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? "Wird erstellt…" : "Konto erstellen"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
