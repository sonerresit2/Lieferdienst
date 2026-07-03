import styles from "./impressum.module.css";

export const metadata = {
  title: "Impressum — Lieferdienst",
};

export default function Impressum() {
  return (
    <main className="page">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Impressum</h1>
        <p className={styles.subtitle}>Angaben gemäß § 5 TMG</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Anbieter</h2>
          <p>Foodexpress GmbH</p>
          <p>Äußere Badstraße 7</p>
          <p>95448 Bayreuth</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Kontakt</h2>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td className={styles.label}>Telefon</td>
                <td>0921 / 918273</td>
              </tr>
              <tr>
                <td className={styles.label}>E-Mail</td>
                <td>
                  <a href="mailto:Foodexpress@Lieferdienst.de">
                    Foodexpress@Lieferdienst.de
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Verantwortlich für den Inhalt</h2>
          <p>Foodexpress GmbH</p>
          <p>Äußere Badstraße 7</p>
          <p>95448 Bayreuth</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Haftungsausschluss</h2>
          <p className={styles.text}>
            Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt.
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
            können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter
            sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Hinweis</h2>
          <p className={styles.text}>
            Diese Website wurde im Rahmen eines Schulprojekts erstellt
            und dient ausschließlich Demonstrationszwecken.
          </p>
        </section>
      </div>
    </main>
  );
}
