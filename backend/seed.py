"""
seed.py — Legt Testdaten an falls DB leer ist.
Weist beim Start automatisch Bilder aus product_images/ den Produkten zu,
basierend auf Dateinamen-Übereinstimmung mit Produktnamen.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models import User, Vendor, Product, ProductImage, Order, OrderItem, Review

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Ordner wo Bilder liegen (im Container)
IMAGE_DIR = "app/static/product_images"

def assign_images():
    """
    Weist vorhandene Bilder aus product_images/ den Produkten zu.
    Matching: Dateiname wird mit Produktnamen verglichen (case-insensitiv,
    Leerzeichen/Sonderzeichen werden ignoriert).
    Wird bei jedem Start aufgerufen, nicht nur beim ersten Seed.
    """
    if not os.path.exists(IMAGE_DIR):
        print("Kein product_images-Ordner gefunden, überspringe Bildzuordnung.")
        return

    image_files = [
        f for f in os.listdir(IMAGE_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]

    if not image_files:
        print("Keine Bilder im product_images-Ordner gefunden.")
        return

    products = db.query(Product).all()
    assigned = 0

    for image_file in image_files:
        # Dateiname ohne Endung, normalisiert für Vergleich
        image_name = os.path.splitext(image_file)[0].lower()
        image_name_clean = "".join(c for c in image_name if c.isalnum())

        best_match = None
        best_score = 0

        for product in products:
            product_name_clean = "".join(
                c for c in product.name.lower() if c.isalnum()
            )
            # Einfaches Matching: wie viele Zeichen übereinstimmen
            common = sum(1 for c in image_name_clean if c in product_name_clean)
            score = common / max(len(image_name_clean), len(product_name_clean), 1)

            if score > best_score and score > 0.4:
                best_score = score
                best_match = product

        if best_match:
            # Prüfen ob Bild schon zugewiesen ist
            existing = db.query(ProductImage).filter(
                ProductImage.product_id == best_match.id,
                ProductImage.image_path.contains(image_file)
            ).first()

            if not existing:
                # Alle bisherigen primary-Bilder des Produkts zurücksetzen
                db.query(ProductImage).filter(
                    ProductImage.product_id == best_match.id
                ).update({"is_primary": False})

                db.add(ProductImage(
                    product_id=best_match.id,
                    image_path=f"/static/product_images/{image_file}",
                    is_primary=True,
                ))
                assigned += 1
                print(f"  ✓ '{image_file}' → '{best_match.name}'")
        else:
            print(f"  ? '{image_file}' → kein passendes Produkt gefunden")

    db.commit()
    print(f"Bildzuordnung abgeschlossen: {assigned} neu zugewiesen.")


try:
    # ===== Seed (nur wenn DB leer) =====
    if db.query(User).count() > 0:
        print("Datenbank bereits befüllt, Seed wird übersprungen.")
    else:
        print("Seed-Daten werden angelegt...")

        users = [
            User(email="tom@lieferdienst.de",   password_hash=hash_password("passwort123"), full_name="Tom Mustermann", role="customer"),
            User(email="soner@lieferdienst.de", password_hash=hash_password("passwort123"), full_name="Soner Yilmaz",   role="customer"),
            User(email="thomas@lieferdienst.de", password_hash=hash_password("passwort123"), full_name="Thomas Laukard",   role="customer"),

        ]
        db.add_all(users)
        db.flush()

        china = Vendor(name="China-Fan Imbiss",  description="Authentische asiatische Küche — schnell, frisch, lecker.", delivery_fee="1.99", delivery_time_min=11)
        poke  = Vendor(name="Dai Poke Bowls",    description="Frische Poke Bowls mit saisonalen Zutaten.",               delivery_fee="2.49", delivery_time_min=16)
        pizza = Vendor(name="Pizza Piazza Bayreuth", description="Italienische Pizza und Pasta.", delivery_fee="2.50", delivery_time_min=35)
        doener = Vendor(name="Dönerhaus Bayreuth", description="Döner, Dürüm und türkische Spezialitäten.", delivery_fee="1.99", delivery_time_min=25)
        burger = Vendor(name="Burger Manufaktur", description="Frische Burger und Beilagen.", delivery_fee="2.99", delivery_time_min=30)
        sushi = Vendor(name="Sushi Sakura", description="Sushi und japanische Spezialitäten.", delivery_fee="3.50", delivery_time_min=40)
        franken = Vendor(name="Franken Grill", description="Fränkische Küche und Grillspezialitäten.", delivery_fee="2.50", delivery_time_min=35)
        cafe = Vendor(name="Café Schlossterrasse", description="Kaffee, Kuchen und Desserts.", delivery_fee="1.50", delivery_time_min=20)

        db.add_all([china, poke, pizza, doener, burger, sushi, franken, cafe])
        db.flush()

        china_items = [
            ("Gebratene Nudeln",       "Wok-gebratene Nudeln mit Hühnchen, Ei und frischem Gemüse.",           "8.90",  "Hauptgericht"),
            ("Kung Pao Chicken",       "Gebratenes Hühnchen mit Erdnüssen und Chili in würziger Sauce.",        "10.50", "Hauptgericht"),
            ("Frühlingrollen (4 Stk)", "Knusprige Frühlingsrollen, vegetarisch, mit Sweet-Chili-Dip.",          "4.50",  "Vorspeise"),
            ("Wan-Tan-Suppe",          "Klare Brühe mit gefüllten Wan-Tan-Teigtaschen und Frühlingszwiebeln.",  "5.90",  "Vorspeise"),
            ("Mango-Eistee",           "Hausgemachter Eistee mit frischer Mango, kalt serviert.",               "2.90",  "Getränk"),
        ]

        poke_items = [
            ("Spicy Tuna Bowl",        "Sushireis, roher Thunfisch, Avocado, Edamame, Sriracha-Mayo.",   "11.90", "Bowl"),
            ("Chicken Teriyaki Bowl",  "Basmati-Reis, gegrilltes Hühnchen, Brokkoli, Teriyaki-Glasur.",   "10.90", "Bowl"),
            ("Veggie Rainbow Bowl",    "Quinoa, geröstete Kichererbsen, Paprika, Gurke, Tahini-Dressing.", "9.90",  "Bowl"),
            ("Miso-Suppe",             "Traditionelle japanische Miso-Suppe mit Tofu und Wakame.",         "3.50",  "Beilage"),
            ("Matcha Latte",           "Cremiger Matcha Latte mit Hafermilch, kalt oder warm.",            "3.90",  "Getränk"),
        ]

        pizza_items = [
            ("Pizza Margherita", "Tomaten und Mozzarella", "8.90", "Hauptgericht"),
            ("Pizza Salami", "Mit italienischer Salami", "10.90", "Hauptgericht"),
            ("Tiramisu", "Hausgemachtes Tiramisu", "4.90", "Nachtisch"),
            ("Cola 0,5L", "Erfrischungsgetränk", "2.90", "Getränk"),
        ]
        
        doener_items = [
            ("Döner Kebab", "Mit frischem Salat", "7.50", "Hauptgericht"),
            ("Dürüm", "Gerollter Döner", "8.50", "Hauptgericht"),
            ("Pommes Frites", "Knusprig und goldbraun", "3.50", "Beilage"),
            ("Ayran", "Joghurtgetränk", "2.50", "Getränk"),
        ]

        burger_items = [
            ("Cheeseburger", "Mit Cheddar", "9.90", "Hauptgericht"),
            ("Chicken Burger", "Knuspriges Hähnchenfilet", "10.50", "Hauptgericht"),
            ("Süßkartoffelpommes", "Mit Dip", "4.50", "Beilage"),
            ("Sprite 0,5L", "Zitronenlimonade", "2.90", "Getränk"),
        ]

        sushi_items = [
            ("California Roll", "8 Stück", "8.90", "Hauptgericht"),
            ("Lachs Nigiri", "5 Stück", "7.90", "Hauptgericht"),
            ("Edamame", "Gedämpfte Sojabohnen", "4.50", "Vorspeise"),
            ("Grüner Tee", "Heiß serviert", "2.80", "Getränk"),
        ]

        franken_items = [
            ("Fränkischer Braten", "Mit Kloß und Soße", "12.90", "Hauptgericht"),
            ("Bratwürste", "Mit Sauerkraut", "9.90", "Hauptgericht"),
            ("Kartoffelsalat", "Hausgemacht", "3.90", "Beilage"),
            ("Apfelschorle", "0,5 Liter", "2.90", "Getränk"),
        ]

        cafe_items = [
            ("Käsekuchen", "Hausgemachter Käsekuchen", "4.50", "Nachtisch"),
            ("Schwarzwälder Kirschtorte", "Frisch vom Konditor", "4.90", "Nachtisch"),
            ("Cappuccino", "Italienische Kaffeespezialität", "3.20", "Getränk"),
            ("Latte Macchiato", "Milchkaffee", "3.80", "Getränk"),
        ]

        for name, desc, price, cat in china_items:
            db.add(Product(vendor_id=china.id, name=name, description=desc, price=price, category=cat, is_available=True))

        for name, desc, price, cat in poke_items:
            db.add(Product(vendor_id=poke.id, name=name, description=desc, price=price, category=cat, is_available=True))
            
        for name, desc, price, cat in pizza_items:
            db.add(Product(vendor_id=pizza.id, name=name, description=desc, price=price, category=cat, is_available=True))
            
        for name, desc, price, cat in doener_items:
            db.add(Product(vendor_id=doener.id, name=name, description=desc, price=price, category=cat, is_available=True))
        
        for name, desc, price, cat in burger_items:
            db.add(Product(vendor_id=burger.id, name=name, description=desc, price=price, category=cat, is_available=True))
            
        for name, desc, price, cat in sushi_items:
            db.add(Product(vendor_id=sushi.id, name=name, description=desc, price=price, category=cat, is_available=True))

        for name, desc, price, cat in franken_items:
            db.add(Product(vendor_id=franken.id, name=name, description=desc, price=price, category=cat, is_available=True))

        for name, desc, price, cat in cafe_items:
            db.add(Product(vendor_id=cafe.id, name=name, description=desc, price=price, category=cat, is_available=True))
            
        db.commit()

        # ===== Demo-Bestellungen + Bewertungen =====
        # Ohne das könnten Anbieter/Produkte direkt nach dem Seed nicht bewertet
        # werden (Bewerten setzt eine eigene Bestellung voraus) und die Sterne
        # wären in der Präsentation überall leer.
        tom, soner, thomas = users

        def make_order(user, vendor, items):
            """items: Liste von (Product, quantity)-Tupeln, alle vom selben vendor."""
            total = sum(p.price * qty for p, qty in items)
            order = Order(user_id=user.id, vendor_id=vendor.id, status="pending", total_price=total)
            db.add(order)
            db.flush()
            for product, qty in items:
                db.add(OrderItem(order_id=order.id, product_id=product.id, quantity=qty, unit_price=product.price))
            return order

        china_products = db.query(Product).filter(Product.vendor_id == china.id).all()
        poke_products = db.query(Product).filter(Product.vendor_id == poke.id).all()
        pizza_products = db.query(Product).filter(Product.vendor_id == pizza.id).all()

        order1 = make_order(tom, china, [(china_products[0], 1), (china_products[2], 1)])
        order2 = make_order(soner, poke, [(poke_products[0], 2)])
        order3 = make_order(thomas, pizza, [(pizza_products[0], 1)])
        db.flush()

        db.add_all([
            Review(user_id=tom.id, vendor_id=china.id, order_id=order1.id, rating=5, comment="Sehr schnell geliefert, top!"),
            Review(user_id=tom.id, product_id=china_products[0].id, order_id=order1.id, rating=4, comment="Lecker, könnte etwas würziger sein."),
            Review(user_id=soner.id, vendor_id=poke.id, order_id=order2.id, rating=5, comment="Frisch und lecker."),
            Review(user_id=soner.id, product_id=poke_products[0].id, order_id=order2.id, rating=5),
            Review(user_id=thomas.id, vendor_id=pizza.id, order_id=order3.id, rating=4, comment="Gute Pizza, Lieferzeit ok."),
        ])
        db.commit()

        product_count = (
            len(china_items)
            + len(poke_items)
            + len(pizza_items)
            + len(doener_items)
            + len(burger_items)
            + len(sushi_items)
            + len(franken_items)
            + len(cafe_items)
        )

        print(f"✓ {len(users)} User angelegt")
        print(f"✓ 8 Anbieter angelegt")
        print(f"✓ {product_count} Produkte angelegt")

        print()
        print("Login-Daten:")
        for u in users:
            print(f"  {u.email}  /  passwort123")
        print()

    # ===== Bilder immer zuweisen (auch bei existierender DB) =====
    print("Starte Bildzuordnung...")
    assign_images()

except Exception as e:
    db.rollback()
    print(f"Seed fehlgeschlagen: {e}")
    raise
finally:
    db.close()
