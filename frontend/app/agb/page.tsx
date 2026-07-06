"use client";
import styles from "./agb.module.css";

export default function AgbPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Allgemeine Geschäftsbedingungen</h1>

      <div className={styles.notice}>
        Hinweis: Diese Seite ist Teil eines schulischen IHK-Abschlussprojekts
        und dient ausschließlich Demonstrationszwecken. Es kommen keine
        echten Verträge zustande, es finden keine echten Zahlungen statt.
      </div>

      <section className={styles.section}>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der
          Plattform Foodexpress (nachfolgend „Plattform“), betrieben von
          der Foodexpress GmbH, Äußere Badstraße 7, 95448 Bayreuth.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Vertragspartner</h2>
        <p>
          Vertragspartner ist die Foodexpress GmbH. Die Plattform vermittelt
          im Rahmen dieses Projekts simulierte Bestellungen zwischen
          Nutzerinnen/Nutzern und den auf der Plattform dargestellten
          Anbietern.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Zustandekommen der Bestellung</h2>
        <p>
          Nach Registrierung und Login können Nutzerinnen und Nutzer
          Produkte in den Warenkorb legen und über die Checkout-Funktion
          eine Bestellung simulieren. Mit Bestätigung des Checkout-Vorgangs
          gilt die Bestellung im Rahmen dieses Projekts als aufgegeben.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Preise und Zahlung</h2>
        <p>
          Die angezeigten Preise verstehen sich als Beispielpreise. Eine
          echte Zahlungsabwicklung erfolgt nicht, da es sich um ein
          Demonstrationssystem ohne reale Bestellabwicklung handelt.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Lieferung</h2>
        <p>
          Eine tatsächliche Lieferung der bestellten Artikel erfolgt nicht.
          Die angezeigten Liefer- und Bearbeitungszeiten dienen ausschließlich
          der Veranschaulichung typischer Funktionen einer
          Lieferdienst-Plattform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Widerrufsrecht</h2>
        <p>
          Da es sich um kein reales Vertragsverhältnis handelt, entfällt ein
          tatsächliches Widerrufsrecht. In einem produktiven Betrieb würde
          an dieser Stelle eine Widerrufsbelehrung gemäß den gesetzlichen
          Vorgaben für Fernabsatzverträge stehen.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Haftung</h2>
        <p>
          Da die Plattform ausschließlich zu Demonstrations- und
          Ausbildungszwecken betrieben wird, wird keine Haftung für die
          Richtigkeit, Vollständigkeit oder Verfügbarkeit der dargestellten
          Inhalte übernommen.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Schlussbestimmungen</h2>
        <p>
          Sollte eine Bestimmung dieser Geschäftsbedingungen unwirksam sein,
          bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.
        </p>
      </section>
    </main>
  );
}
