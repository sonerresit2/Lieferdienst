"""
seed.py — Legt Testdaten in der Datenbank an, falls noch keine vorhanden sind.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models import User, Vendor, Product, ProductImage

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

    # Picsum-Bilder: seed= sorgt für konsistente, schöne Food-Fotos
    # (seed-Nummern wurden manuell ausgewählt — alle zeigen appetitliches Essen)
    def img(url): return url

    # ===== Produkte China-Fan Imbiss =====
    china_items = [
        ("Gebratene Nudeln",       "Wok-gebratene Nudeln mit Hühnchen, Ei und frischem Gemüse.",              "8.90",  "Hauptgericht", "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Kung Pao Chicken",       "Gebratenes Hühnchen mit Erdnüssen und Chili in würziger Sauce.",           "10.50", "Hauptgericht", "https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Frühlingrollen (4 Stk)", "Knusprige Frühlingsrollen, vegetarisch, mit Sweet-Chili-Dip.",            "4.50",  "Vorspeise",   "https://images.pexels.com/photos/955137/pexels-photo-955137.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Wan-Tan-Suppe",          "Klare Brühe mit gefüllten Wan-Tan-Teigtaschen und Frühlingszwiebeln.",    "5.90",  "Vorspeise",   "https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Mango-Eistee",           "Hausgemachter Eistee mit frischer Mango, kalt serviert.",                  "2.90",  "Getränk",     "https://images.pexels.com/photos/3407777/pexels-photo-3407777.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
    ]

    # ===== Produkte Dai Poke Bowls =====
    poke_items = [
        ("Spicy Tuna Bowl",        "Sushireis, roher Thunfisch, Avocado, Edamame, Sriracha-Mayo.",            "11.90", "Bowl",     "https://images.pexels.com/photos/2116094/pexels-photo-2116094.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Chicken Teriyaki Bowl",  "Basmati-Reis, gegrilltes Hühnchen, Brokkoli, Teriyaki-Glasur.",           "10.90", "Bowl",     "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Veggie Rainbow Bowl",    "Quinoa, geröstete Kichererbsen, Paprika, Gurke, Tahini-Dressing.",        "9.90",  "Bowl",     "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Miso-Suppe",             "Traditionelle japanische Miso-Suppe mit Tofu und Wakame.",                 "3.50",  "Beilage",  "https://images.pexels.com/photos/5908233/pexels-photo-5908233.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
        ("Matcha Latte",           "Cremiger Matcha Latte mit Hafermilch, kalt oder warm.",                    "3.90",  "Getränk",  "https://images.pexels.com/photos/3679622/pexels-photo-3679622.jpeg?w=800&h=800&auto=compress&cs=tinysrgb"),
    ]

    for name, desc, price, cat, img_url in china_items:
        p = Product(vendor_id=china.id, name=name, description=desc, price=price, category=cat, is_available=True)
        db.add(p)
        db.flush()
        db.add(ProductImage(product_id=p.id, image_path=img_url, is_primary=True))

    for name, desc, price, cat, img_url in poke_items:
        p = Product(vendor_id=poke.id, name=name, description=desc, price=price, category=cat, is_available=True)
        db.add(p)
        db.flush()
        db.add(ProductImage(product_id=p.id, image_path=img_url, is_primary=True))

    db.commit()

    print(f"✓ {len(users)} User angelegt")
    print(f"✓ 2 Anbieter angelegt")
    print(f"✓ {len(china_items) + len(poke_items)} Produkte mit Bildern angelegt")
    print()
    print("Login-Daten:")
    for u in users:
        print(f"  {u.email}  /  passwort123")

except Exception as e:
    db.rollback()
    print(f"Seed fehlgeschlagen: {e}")
    raise
finally:
    db.close()
