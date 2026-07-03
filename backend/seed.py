"""
seed.py — Legt Testdaten in der Datenbank an, falls noch keine vorhanden sind.
Produkte werden bewusst OHNE Bild angelegt — Bilder werden über den
Endpunkt POST /products/{id}/images hochgeladen (siehe README, Abschnitt
"Bilder hinzufügen").
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models import User, Vendor, Product

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    if db.query(User).count() > 0:
        print("Datenbank bereits befüllt, Seed wird übersprungen.")
        sys.exit(0)

    print("Seed-Daten werden angelegt...")

    # ===== User =====
    users = [
        User(email="tom@lieferdienst.de",   password_hash=hash_password("passwort123"), full_name="Tom Mustermann", role="customer"),
        User(email="soner@lieferdienst.de", password_hash=hash_password("passwort123"), full_name="Soner Yilmaz",   role="customer"),
    ]
    db.add_all(users)
    db.flush()

    # ===== Anbieter =====
    china = Vendor(name="China-Fan Imbiss",  description="Authentische asiatische Küche — schnell, frisch, lecker.", delivery_fee="1.99", delivery_time_min=11, rating="4.7")
    poke  = Vendor(name="Dai Poke Bowls",    description="Frische Poke Bowls mit saisonalen Zutaten.",               delivery_fee="2.49", delivery_time_min=16, rating="4.5")
    db.add_all([china, poke])
    db.flush()

    # ===== Produkte China-Fan Imbiss =====
    china_items = [
        ("Gebratene Nudeln",       "Wok-gebratene Nudeln mit Hühnchen, Ei und frischem Gemüse.",           "8.90",  "Hauptgericht"),
        ("Kung Pao Chicken",       "Gebratenes Hühnchen mit Erdnüssen und Chili in würziger Sauce.",        "10.50", "Hauptgericht"),
        ("Frühlingrollen (4 Stk)", "Knusprige Frühlingsrollen, vegetarisch, mit Sweet-Chili-Dip.",          "4.50",  "Vorspeise"),
        ("Wan-Tan-Suppe",          "Klare Brühe mit gefüllten Wan-Tan-Teigtaschen und Frühlingszwiebeln.",  "5.90",  "Vorspeise"),
        ("Mango-Eistee",           "Hausgemachter Eistee mit frischer Mango, kalt serviert.",               "2.90",  "Getränk"),
    ]

    # ===== Produkte Dai Poke Bowls =====
    poke_items = [
        ("Spicy Tuna Bowl",        "Sushireis, roher Thunfisch, Avocado, Edamame, Sriracha-Mayo.",   "11.90", "Bowl"),
        ("Chicken Teriyaki Bowl",  "Basmati-Reis, gegrilltes Hühnchen, Brokkoli, Teriyaki-Glasur.",   "10.90", "Bowl"),
        ("Veggie Rainbow Bowl",    "Quinoa, geröstete Kichererbsen, Paprika, Gurke, Tahini-Dressing.", "9.90",  "Bowl"),
        ("Miso-Suppe",             "Traditionelle japanische Miso-Suppe mit Tofu und Wakame.",         "3.50",  "Beilage"),
        ("Matcha Latte",           "Cremiger Matcha Latte mit Hafermilch, kalt oder warm.",            "3.90",  "Getränk"),
    ]

    for name, desc, price, cat in china_items:
        db.add(Product(vendor_id=china.id, name=name, description=desc, price=price, category=cat, is_available=True))

    for name, desc, price, cat in poke_items:
        db.add(Product(vendor_id=poke.id, name=name, description=desc, price=price, category=cat, is_available=True))

    db.commit()

    print(f"✓ {len(users)} User angelegt")
    print(f"✓ 2 Anbieter angelegt")
    print(f"✓ {len(china_items) + len(poke_items)} Produkte angelegt (noch ohne Bilder)")
    print()
    print("Login-Daten:")
    for u in users:
        print(f"  {u.email}  /  passwort123")
    print()
    print("Bilder hochladen: http://localhost:8000/docs -> POST /products/{id}/images")

except Exception as e:
    db.rollback()
    print(f"Seed fehlgeschlagen: {e}")
    raise
finally:
    db.close()
