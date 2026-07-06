"use client";
import styles from "./datenschutz.module.css";

export default function DatenschutzPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Datenschutzerklärung</h1>

      <div className={styles.notice}>
        Hinweis: Diese Seite ist Teil eines schulischen IHK-Abschlussprojekts
        und dient ausschließlich Demonstrationszwecken. Es werden keine echten
        Bestellungen oder Zahlungen verarbeitet. Die hier verwendeten Daten
        dienen nur der Veranschaulichung typischer Datenschutzhinweise einer
        Food-Delivery-Plattform.
      </div>

      <section className={styles.section}>
        <h2>1. Verantwortlicher</h2>
        <p>
          Foodexpress GmbH<br />
          Äußere Badstraße 7<br />
          95448 Bayreuth
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Übersicht der Verarbeitungen</h2>
        <p>
          Wir verarbeiten personenbezogene Daten, die für den Betrieb dieser
          Plattform notwendig sind: bei der Registrierung, beim Login sowie
          bei der Nutzung des Warenkorbs und der Bestellfunktion.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Registrierung und Login</h2>
        <p>
          Bei der Registrierung erheben wir Ihren Namen, Ihre E-Mail-Adresse
          sowie ein von Ihnen gewähltes Passwort. Das Passwort wird
          ausschließlich in gehashter Form (bcrypt) gespeichert und ist für
          uns nicht im Klartext einsehbar. Diese Daten sind zur Erfüllung
          des Nutzungsvertrags erforderlich (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Warenkorb und Bestellungen</h2>
        <p>
          Zur Abwicklung des Bestellvorgangs verarbeiten wir die von Ihnen
          in den Warenkorb gelegten Artikel sowie den daraus resultierenden
          Bestellbetrag. Eine echte Zahlungsabwicklung findet nicht statt,
          der Checkout-Vorgang ist im Rahmen dieses Projekts simuliert.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Lokale Speicherung (Local Storage)</h2>
        <p>
          Diese Website speichert nach erfolgreichem Login ein
          Authentifizierungs-Token im Local Storage Ihres Browsers. Diese
          Speicherung ist technisch notwendig, um Sie während Ihrer Sitzung
          eingeloggt zu halten, und erfolgt gemäß § 25 Abs. 2 Nr. 2 TTDSG
          ohne Einholung einer gesonderten Einwilligung. Das Token wird beim
          Logout oder durch Löschen der Browserdaten entfernt.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Cookies</h2>
        <p>
          Diese Website verwendet ausschließlich technisch notwendige
          Speicherung (siehe Abschnitt 5). Es findet kein Tracking, keine
          Analyse-Cookies und keine Weitergabe von Nutzungsdaten an
          Drittanbieter statt. Der beim ersten Besuch angezeigte Hinweis
          dient der Transparenz, blockiert aber keine nicht vorhandenen
          Tracking-Mechanismen.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Weitergabe an Dritte</h2>
        <p>
          Eine Weitergabe Ihrer Daten an Dritte findet nicht statt. Alle
          Daten verbleiben ausschließlich innerhalb der für dieses Projekt
          betriebenen Infrastruktur.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Speicherdauer</h2>
        <p>
          Ihre Daten werden gespeichert, solange Ihr Nutzerkonto besteht.
          Nach Löschung des Kontos werden die zugehörigen Daten entfernt,
          sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Ihre Rechte</h2>
        <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf:</p>
        <ul className={styles.list}>
          <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>10. Beschwerderecht</h2>
        <p>
          Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde
          über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Kontakt</h2>
        <p>Bei Fragen zum Datenschutz wenden Sie sich bitte an: kontakt@lieferdienst.de</p>
      </section>
    </main>
  );
}
