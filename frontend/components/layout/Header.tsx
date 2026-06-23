"use client";

import { useState } from "react";
import styles from "./Header.module.css";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import AuthModal from "@/components/auth/AuthModal";
import CartPanel from "@/components/cart/CartPanel";

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [cartOpen, setCartOpen] = useState(false);

  function openAuth(tab: "login" | "register") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <a href="/" className={styles.brand}>
            <span>🍴</span>
            <span className={styles.brandText}>Lieferdienst</span>
          </a>

          <nav className={styles.actions}>
            {user ? (
              <>
                <span className={styles.greeting}>
                  Hallo, <strong>{user.full_name.split(" ")[0]}</strong>
                </span>
                <button className="btn btn--ghost btn--small" onClick={logout}>
                  Abmelden
                </button>
              </>
            ) : (
              <button
                className="btn btn--ghost btn--small"
                onClick={() => openAuth("login")}
              >
                Anmelden
              </button>
            )}

            <button
              className={styles.cartBtn}
              onClick={() => setCartOpen(true)}
              aria-label="Warenkorb öffnen"
            >
              🧾
              {itemCount > 0 && (
                <span className={styles.cartCount}>{itemCount}</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {authOpen && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setAuthOpen(false)}
          onSwitchTab={setAuthTab}
        />
      )}

      {cartOpen && <CartPanel onClose={() => setCartOpen(false)} />}
    </>
  );
}
