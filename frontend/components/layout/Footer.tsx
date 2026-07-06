import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>© 2026 Foodexpress GmbH</p>
        <a href="/impressum" className={styles.link}>Impressum</a>
        <a href="/datenschutz" className={styles.link}>Datenschutz</a>
        <a href="/agb" className={styles.link}>AGB</a>
      </div>
    </footer>
  );
}