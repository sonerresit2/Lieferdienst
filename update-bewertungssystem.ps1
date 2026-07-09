# ============================================================
# Lieferdienst - Bewertungssystem (Anbieter + Produkte)
# Erstellt/ueberschreibt alle betroffenen Dateien mit UTF-8 (ohne BOM).
# Fuehrt KEINE git/docker-Befehle aus - das macht ihr manuell danach.
# ============================================================

$root = "C:\Users\tomnit01\Downloads\Lieferdienst"

if (-not (Test-Path $root)) {
    Write-Host "Projektordner nicht gefunden: $root" -ForegroundColor Red
    Write-Host "Bitte Variable `$root am Skriptanfang anpassen." -ForegroundColor Red
    exit 1
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content + "`n", $enc)
    Write-Host "  geschrieben: $Path" -ForegroundColor Green
}

Write-Host "Schreibe Dateien..." -ForegroundColor Cyan

# ---- backend\app\models\review.py (NEU) ----
$content = @'
from sqlalchemy import (
    Column,
    Integer,
    SmallInteger,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Review(Base):
    """Bewertung eines Users zu genau einem Ziel: entweder Anbieter ODER Produkt.
    Referenziert die Bestellung, mit der die Berechtigung zum Bewerten nachgewiesen wurde.
    """

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint(
            "(vendor_id IS NOT NULL AND product_id IS NULL) OR "
            "(vendor_id IS NULL AND product_id IS NOT NULL)",
            name="ck_review_exactly_one_target",
        ),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
        UniqueConstraint("user_id", "vendor_id", name="uq_review_user_vendor"),
        UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    rating = Column(SmallInteger, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    vendor = relationship("Vendor")
    product = relationship("Product")
    order = relationship("Order")
'@
Write-Utf8NoBom (Join-Path $root "backend\app\models\review.py") $content

# ---- backend\app\models\__init__.py (GEAENDERT) ----
$content = @'
from app.models.user import User
from app.models.vendor import Vendor
from app.models.product import Product, ProductImage
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.review import Review

__all__ = [
    "User",
    "Vendor",
    "Product",
    "ProductImage",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
    "Review",
]
'@
Write-Utf8NoBom (Join-Path $root "backend\app\models\__init__.py") $content

# ---- backend\app\models\vendor.py (GEAENDERT) ----
$content = @'
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    # Kein gespeichertes rating-Feld mehr: der Durchschnitt wird live aus
    # den reviews berechnet (siehe routers/vendors.py, _attach_rating_summary).
    delivery_fee = Column(Numeric(6, 2), nullable=False, default=0)
    delivery_time_min = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="vendor")
    orders = relationship("Order", back_populates="vendor")
'@
Write-Utf8NoBom (Join-Path $root "backend\app\models\vendor.py") $content

# ---- backend\app\schemas\review.py (NEU) ----
$content = @'
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class ReviewCreate(BaseModel):
    vendor_id: Optional[int] = None
    product_id: Optional[int] = None
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def check_exactly_one_target(self):
        if (self.vendor_id is None) == (self.product_id is None):
            raise ValueError(
                "Es muss entweder vendor_id oder product_id angegeben werden (genau eines von beiden)."
            )
        return self


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: Optional[int] = None
    product_id: Optional[int] = None
    order_id: int
    rating: int
    comment: Optional[str] = None
'@
Write-Utf8NoBom (Join-Path $root "backend\app\schemas\review.py") $content

# ---- backend\app\schemas\vendor.py (GEAENDERT) ----
$content = @'
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class VendorBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    delivery_fee: Decimal = Field(default=0, ge=0)
    delivery_time_min: Optional[int] = Field(default=None, ge=0)


class VendorCreate(VendorBase):
    pass


class VendorOut(VendorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avg_rating: Optional[float] = None
    review_count: int = 0
'@
Write-Utf8NoBom (Join-Path $root "backend\app\schemas\vendor.py") $content

# ---- backend\app\schemas\product.py (GEAENDERT) ----
$content = @'
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_path: str
    is_primary: bool


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(gt=0, description="Preis muss größer als 0 sein")
    category: Optional[str] = Field(default=None, max_length=100)
    is_available: bool = True


class ProductCreate(ProductBase):
    vendor_id: int


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, max_length=100)
    is_available: Optional[bool] = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: int
    images: list[ProductImageOut] = []
    avg_rating: Optional[float] = None
    review_count: int = 0
'@
Write-Utf8NoBom (Join-Path $root "backend\app\schemas\product.py") $content

# ---- backend\app\routers\reviews.py (NEU) ----
$content = @'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.order import Order, OrderItem
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Bewertungen"])


def _find_eligible_order_id(
    db: Session, user: User, vendor_id: int | None, product_id: int | None
) -> int | None:
    """Prüft serverseitig, ob der User bereits eine eigene Bestellung mit diesem
    Anbieter bzw. Produkt hat. Gibt die passende Order-ID zurück, sonst None.
    """
    if vendor_id is not None:
        order = (
            db.query(Order)
            .filter(Order.user_id == user.id, Order.vendor_id == vendor_id)
            .order_by(Order.created_at.desc())
            .first()
        )
        return order.id if order else None

    order = (
        db.query(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .filter(Order.user_id == user.id, OrderItem.product_id == product_id)
        .order_by(Order.created_at.desc())
        .first()
    )
    return order.id if order else None


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_or_update_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Legt eine Bewertung an oder aktualisiert die bestehende (ein User kann
    einen Anbieter/ein Produkt nur einmal bewerten, danach wird überschrieben).
    """
    order_id = _find_eligible_order_id(db, current_user, payload.vendor_id, payload.product_id)
    if order_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Du kannst nur Anbieter oder Produkte bewerten, die du bereits bestellt hast.",
        )

    query = db.query(Review).filter(Review.user_id == current_user.id)
    if payload.vendor_id is not None:
        existing = query.filter(Review.vendor_id == payload.vendor_id).first()
    else:
        existing = query.filter(Review.product_id == payload.product_id).first()

    if existing:
        existing.rating = payload.rating
        existing.comment = payload.comment
        existing.order_id = order_id
        db.commit()
        db.refresh(existing)
        return existing

    review = Review(
        user_id=current_user.id,
        vendor_id=payload.vendor_id,
        product_id=payload.product_id,
        order_id=order_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/me", response_model=list[ReviewOut])
def list_my_reviews(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Alle eigenen Bewertungen, damit das Frontend weiß, was bereits bewertet wurde."""
    return db.query(Review).filter(Review.user_id == current_user.id).all()
'@
Write-Utf8NoBom (Join-Path $root "backend\app\routers\reviews.py") $content

# ---- backend\app\routers\vendors.py (GEAENDERT) ----
$content = @'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.vendor import Vendor
from app.models.review import Review
from app.schemas.vendor import VendorOut, VendorCreate

router = APIRouter(prefix="/vendors", tags=["Anbieter"])


def _attach_rating_summary(db: Session, vendors: list[Vendor]) -> list[Vendor]:
    """Berechnet Ø-Bewertung und Anzahl je Anbieter per SQL-Aggregation und
    haengt sie transient (nicht persistiert) an die ORM-Objekte an.
    """
    if not vendors:
        return vendors

    vendor_ids = [v.id for v in vendors]
    rows = (
        db.query(Review.vendor_id, func.avg(Review.rating), func.count(Review.id))
        .filter(Review.vendor_id.in_(vendor_ids))
        .group_by(Review.vendor_id)
        .all()
    )
    summary = {vendor_id: (float(avg), count) for vendor_id, avg, count in rows}

    for vendor in vendors:
        avg, count = summary.get(vendor.id, (None, 0))
        vendor.avg_rating = round(avg, 1) if avg is not None else None
        vendor.review_count = count

    return vendors


@router.get("", response_model=list[VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(Vendor).all()
    return _attach_rating_summary(db, vendors)


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if vendor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anbieter nicht gefunden.")
    _attach_rating_summary(db, [vendor])
    return vendor


@router.post("", response_model=VendorOut, status_code=status.HTTP_201_CREATED)
def create_vendor(payload: VendorCreate, db: Session = Depends(get_db)):
    vendor = Vendor(**payload.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    vendor.avg_rating = None
    vendor.review_count = 0
    return vendor
'@
Write-Utf8NoBom (Join-Path $root "backend\app\routers\vendors.py") $content

# ---- backend\app\routers\products.py (GEAENDERT) ----
$content = @'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.models.product import Product
from app.models.vendor import Vendor
from app.models.review import Review
from app.schemas.product import ProductOut, ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["Produkte"])


def _attach_rating_summary(db: Session, products: list[Product]) -> list[Product]:
    """Berechnet Ø-Bewertung und Anzahl je Produkt per SQL-Aggregation und
    haengt sie transient (nicht persistiert) an die ORM-Objekte an.
    """
    if not products:
        return products

    product_ids = [p.id for p in products]
    rows = (
        db.query(Review.product_id, func.avg(Review.rating), func.count(Review.id))
        .filter(Review.product_id.in_(product_ids))
        .group_by(Review.product_id)
        .all()
    )
    summary = {product_id: (float(avg), count) for product_id, avg, count in rows}

    for product in products:
        avg, count = summary.get(product.id, (None, 0))
        product.avg_rating = round(avg, 1) if avg is not None else None
        product.review_count = count

    return products


@router.get("", response_model=list[ProductOut])
def list_products(
    vendor_id: int | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    """Liefert alle Produkte als JSON. Optional gefiltert nach Anbieter oder Kategorie."""
    query = db.query(Product).options(joinedload(Product.images))

    if vendor_id is not None:
        query = query.filter(Product.vendor_id == vendor_id)
    if category is not None:
        query = query.filter(Product.category == category)

    products = query.all()
    return _attach_rating_summary(db, products)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(joinedload(Product.images))
        .filter(Product.id == product_id)
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkt nicht gefunden.")
    _attach_rating_summary(db, [product])
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == payload.vendor_id).first()
    if vendor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anbieter nicht gefunden.")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    product.avg_rating = None
    product.review_count = 0
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkt nicht gefunden.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    _attach_rating_summary(db, [product])
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkt nicht gefunden.")

    db.delete(product)
    db.commit()
    return None
'@
Write-Utf8NoBom (Join-Path $root "backend\app\routers\products.py") $content

# ---- backend\app\main.py (GEAENDERT) ----
$content = @'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine
from app.core.error_handlers import register_exception_handlers
from app.routers import products, product_images, vendors, auth, cart, orders, reviews

# Erstellt alle Tabellen aus den Models, falls sie noch nicht existieren.
# Für ein Schulprojekt ausreichend; in größeren Projekten würde man hierfür
# Alembic-Migrationen verwenden (im Repo bereits als Dependency vorbereitet).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lieferdienst API",
    description="Backend für die Food-Delivery-Plattform (Produkte, Auth, Warenkorb, Bestellungen).",
    version="1.0.0",
)

register_exception_handlers(app)

# CORS: erlaubt dem Frontend-Team, die API vom Browser aus anzusprechen.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Für die Schulprojekt-Umgebung offen; in Produktion einschränken.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router)
app.include_router(vendors.router)
app.include_router(products.router)
app.include_router(product_images.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)


@app.get("/", tags=["Status"])
def root():
    return {"status": "ok", "service": "Lieferdienst API"}


@app.get("/health", tags=["Status"])
def health_check():
    return {"status": "healthy"}
'@
Write-Utf8NoBom (Join-Path $root "backend\app\main.py") $content

# ---- backend\seed.py (GEAENDERT) ----
$content = @'
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
'@
Write-Utf8NoBom (Join-Path $root "backend\seed.py") $content

# ---- frontend\lib\types.ts (GEAENDERT) ----
$content = @'
// Spiegelt die Pydantic-Schemas des Backends (app/schemas/) wider.

export interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  vendor_id: number;
  name: string;
  description: string | null;
  price: string; // Decimal kommt als String vom Backend
  category: string | null;
  is_available: boolean;
  images: ProductImage[];
  avg_rating: number | null;
  review_count: number;
}

export interface Vendor {
  id: number;
  name: string;
  description: string | null;
  avg_rating: number | null;
  review_count: number;
  delivery_fee: string;
  delivery_time_min: number | null;
}

export interface Review {
  id: number;
  vendor_id: number | null;
  product_id: number | null;
  order_id: number;
  rating: number;
  comment: string | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  product: Product;
}

export interface Order {
  id: number;
  vendor_id: number;
  status: string;
  total_price: string;
  items: OrderItem[];
}

export interface Token {
  access_token: string;
  token_type: string;
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\lib\types.ts") $content

# ---- frontend\lib\api.ts (GEAENDERT) ----
$content = @'
import type { Cart, Order, Product, Review, Token, User, Vendor } from "./types";

// Im Browser: http://localhost:8000 (Backend läuft außerhalb des Docker-Netzwerks,
// daher immer localhost, nicht der Docker-Servicename "backend").
// Server-seitig (Next.js Server Components / Route Handlers): http://backend:8000
// Die Umgebungsvariable NEXT_PUBLIC_ ist auch im Browser verfügbar.
const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : process.env.API_URL_INTERNAL ?? "http://backend:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lieferdienst_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.detail ?? `Fehler ${res.status}`
    );
  }

  return data as T;
}

// ---- Anbieter ----

export async function getVendors(): Promise<Vendor[]> {
  return request<Vendor[]>("/vendors");
}

// ---- Produkte ----

export async function getProducts(params: {
  vendorId?: number;
  category?: string;
} = {}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params.vendorId) qs.set("vendor_id", String(params.vendorId));
  if (params.category) qs.set("category", params.category);
  const query = qs.toString() ? `?${qs}` : "";
  return request<Product[]>(`/products${query}`);
}

// ---- Auth ----

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
}): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  return request<Token>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me", {}, true);
}

// ---- Warenkorb ----

export async function getCart(): Promise<Cart> {
  return request<Cart>("/cart", {}, true);
}

export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  return request<Cart>(
    "/cart/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    },
    true
  );
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return request<Cart>(
    `/cart/items/${itemId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
    true
  );
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  return request<Cart>(`/cart/items/${itemId}`, { method: "DELETE" }, true);
}

// ---- Bestellungen ----

export async function checkout(): Promise<Order> {
  return request<Order>("/orders/checkout", { method: "POST" }, true);
}

export async function getMyOrders(): Promise<Order[]> {
  return request<Order[]>("/orders", {}, true);
}

// ---- Bewertungen ----

export async function getMyReviews(): Promise<Review[]> {
  return request<Review[]>("/reviews/me", {}, true);
}

export async function submitReview(payload: {
  vendorId?: number;
  productId?: number;
  rating: number;
  comment?: string;
}): Promise<Review> {
  return request<Review>(
    "/reviews",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: payload.vendorId ?? null,
        product_id: payload.productId ?? null,
        rating: payload.rating,
        comment: payload.comment ?? null,
      }),
    },
    true
  );
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\lib\api.ts") $content

# ---- frontend\lib\reviews-context.tsx (NEU) ----
$content = @'
"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "@/lib/api";
import type { Order, Review } from "@/lib/types";
import { useAuth } from "./auth-context";

interface ReviewsContextValue {
  isLoading: boolean;
  canReviewVendor: (vendorId: number) => boolean;
  canReviewProduct: (productId: number) => boolean;
  myVendorReview: (vendorId: number) => Review | undefined;
  myProductReview: (productId: number) => Review | undefined;
  submitVendorReview: (vendorId: number, rating: number, comment?: string) => Promise<void>;
  submitProductReview: (productId: number, rating: number, comment?: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue>({
  isLoading: false,
  canReviewVendor: () => false,
  canReviewProduct: () => false,
  myVendorReview: () => undefined,
  myProductReview: () => undefined,
  submitVendorReview: async () => {},
  submitProductReview: async () => {},
});

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setReviews([]);
      return;
    }
    setIsLoading(true);
    try {
      const [o, r] = await Promise.all([api.getMyOrders(), api.getMyReviews()]);
      setOrders(o);
      setReviews(r);
    } catch {
      // Stiller Fehlschlag: Bewerten-Buttons bleiben dann einfach ausgeblendet.
      setOrders([]);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const orderedVendorIds = useMemo(
    () => new Set(orders.map((o) => o.vendor_id)),
    [orders]
  );
  const orderedProductIds = useMemo(
    () => new Set(orders.flatMap((o) => o.items.map((i) => i.product_id))),
    [orders]
  );

  const canReviewVendor = useCallback(
    (vendorId: number) => orderedVendorIds.has(vendorId),
    [orderedVendorIds]
  );
  const canReviewProduct = useCallback(
    (productId: number) => orderedProductIds.has(productId),
    [orderedProductIds]
  );

  const myVendorReview = useCallback(
    (vendorId: number) => reviews.find((r) => r.vendor_id === vendorId),
    [reviews]
  );
  const myProductReview = useCallback(
    (productId: number) => reviews.find((r) => r.product_id === productId),
    [reviews]
  );

  const submitVendorReview = useCallback(
    async (vendorId: number, rating: number, comment?: string) => {
      const review = await api.submitReview({ vendorId, rating, comment });
      setReviews((prev) => [...prev.filter((r) => r.vendor_id !== vendorId), review]);
    },
    []
  );

  const submitProductReview = useCallback(
    async (productId: number, rating: number, comment?: string) => {
      const review = await api.submitReview({ productId, rating, comment });
      setReviews((prev) => [...prev.filter((r) => r.product_id !== productId), review]);
    },
    []
  );

  return (
    <ReviewsContext.Provider
      value={{
        isLoading,
        canReviewVendor,
        canReviewProduct,
        myVendorReview,
        myProductReview,
        submitVendorReview,
        submitProductReview,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  return useContext(ReviewsContext);
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\lib\reviews-context.tsx") $content

# ---- frontend\app\layout.tsx (GEAENDERT) ----
$content = @'
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ReviewsProvider } from "@/lib/reviews-context";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";

export const metadata: Metadata = {
  title: "Lieferdienst — Speisekarte",
  description: "Food-Delivery-Plattform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>
          <CartProvider>
            <ReviewsProvider>
              <Header />
              {children}
              <Footer />
              <CookieBanner />
            </ReviewsProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\app\layout.tsx") $content

# ---- frontend\components\shared\RatingStars.tsx (NEU) ----
$content = @'
"use client";

import { useState } from "react";
import styles from "./RatingStars.module.css";

interface Props {
  value: number | null;
  count?: number;
  interactive?: boolean;
  size?: "sm" | "md";
  onChange?: (rating: number) => void;
}

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function RatingStars({
  value,
  count,
  interactive = false,
  size = "sm",
  onChange,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value ?? 0;

  if (!interactive) {
    return (
      <span className={`${styles.row} ${styles[size]}`}>
        <span className={styles.stars} aria-hidden="true">
          {STAR_VALUES.map((n) => (
            <span key={n} className={n <= Math.round(displayValue) ? styles.filled : styles.empty}>
              ★
            </span>
          ))}
        </span>
        {value !== null ? (
          <span className={styles.text}>
            {value.toFixed(1)}
            {count !== undefined && <span className={styles.count}> ({count})</span>}
          </span>
        ) : (
          <span className={styles.text}>Noch keine Bewertungen</span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`${styles.row} ${styles[size]} ${styles.interactive}`}
      onMouseLeave={() => setHovered(null)}
    >
      <span className={styles.stars}>
        {STAR_VALUES.map((n) => (
          <button
            key={n}
            type="button"
            className={n <= displayValue ? styles.filled : styles.empty}
            onMouseEnter={() => setHovered(n)}
            onClick={() => onChange?.(n)}
            aria-label={`${n} von 5 Sternen`}
          >
            ★
          </button>
        ))}
      </span>
    </span>
  );
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\components\shared\RatingStars.tsx") $content

# ---- frontend\components\shared\RatingStars.module.css (NEU) ----
$content = @'
.row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stars {
  display: inline-flex;
  gap: 1px;
  line-height: 1;
}

.sm .stars {
  font-size: 0.78rem;
}

.md .stars {
  font-size: 1.1rem;
}

.filled {
  color: #FF9500;
}

.empty {
  color: var(--c-line);
}

.interactive .stars button {
  background: none;
  border: none;
  padding: 2px;
  margin: 0;
  cursor: pointer;
  line-height: 1;
  font: inherit;
  transition: transform .1s;
}

.interactive .stars button:hover {
  transform: scale(1.2);
}

.text {
  font-size: 0.75rem;
  color: var(--c-ink-2);
  font-weight: 500;
  white-space: nowrap;
}

.md .text {
  font-size: 0.85rem;
}

.count {
  color: var(--c-ink-3);
  font-weight: 400;
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\components\shared\RatingStars.module.css") $content

# ---- frontend\components\products\ProductCard.tsx (GEAENDERT) ----
$content = @'
"use client";

import styles from "./ProductCard.module.css";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useReviews } from "@/lib/reviews-context";
import { useState } from "react";
import RatingStars from "@/components/shared/RatingStars";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  product: Product;
  onNeedAuth: () => void;
}

export default function ProductCard({ product, onNeedAuth }: Props) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { canReviewProduct, myProductReview, submitProductReview } = useReviews();
  const [adding, setAdding] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const primaryImage =
    product.images.find((i) => i.is_primary) ?? product.images[0];

  // Bild-URL: wenn der Pfad mit http startet (externe URL wie Picsum),
  // direkt nutzen. Sonst Backend-URL voranstellen (hochgeladene Bilder).
  const imageSrc = primaryImage
    ? primaryImage.image_path.startsWith("http")
      ? primaryImage.image_path
      : `${API_URL}${primaryImage.image_path}`
    : null;

  async function handleAdd() {
    if (!user) { onNeedAuth(); return; }
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  }

  async function handleRate(rating: number) {
    setSubmitting(true);
    try {
      await submitProductReview(product.id, rating);
      setRatingOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const myReview = myProductReview(product.id);
  const eligible = Boolean(user) && canReviewProduct(product.id);

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={product.name} loading="lazy" />
        ) : (
          <span>🍽️</span>
        )}
        {product.category && (
          <span className={styles.badge}>{product.category}</span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.name}>{product.name}</p>
        {product.description && (
          <p className={styles.desc}>{product.description}</p>
        )}

        {(product.review_count > 0 || eligible) && (
          <div className={styles.ratingRow}>
            {product.review_count > 0 && (
              <RatingStars value={product.avg_rating} count={product.review_count} />
            )}
            {eligible && !ratingOpen && (
              <button type="button" className={styles.rateLink} onClick={() => setRatingOpen(true)}>
                {myReview ? "Bewertung ändern" : "Bewerten"}
              </button>
            )}
          </div>
        )}

        {ratingOpen && (
          <div className={styles.rateInput}>
            <RatingStars
              value={myReview?.rating ?? 0}
              interactive
              size="md"
              onChange={handleRate}
            />
            {submitting && <span className={styles.rateHint}>Speichere…</span>}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={!product.is_available || adding}
          >
            {adding ? "…" : product.is_available ? "Hinzufügen" : "Ausverkauft"}
          </button>
        </div>
      </div>
    </article>
  );
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\components\products\ProductCard.tsx") $content

# ---- frontend\components\products\ProductCard.module.css (GEAENDERT) ----
$content = @'
.card {
  background: var(--c-surface);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: box-shadow .2s, transform .2s;
  cursor: default;
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

/* Quadratisches Bild — wie App-Store-Kacheln */
.image {
  aspect-ratio: 1 / 1;
  width: 100%;
  background: linear-gradient(135deg, #E8E8ED, #D2D2D7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  overflow: hidden;
  position: relative;
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .3s ease;
}

.card:hover .image img { transform: scale(1.03); }

.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 3px 8px;
  border-radius: 999px;
}

.body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.category {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-ink-2);
}

.name {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--c-ink);
  line-height: 1.25;
  margin: 2px 0 4px;
}

.desc {
  font-size: 0.78rem;
  color: var(--c-ink-2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.ratingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.rateLink {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--c-accent);
  cursor: pointer;
  white-space: nowrap;
}

.rateLink:hover {
  text-decoration: underline;
}

.rateInput {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 6px 8px;
  background: var(--c-fill);
  border-radius: var(--r-sm);
}

.rateHint {
  font-size: 0.72rem;
  color: var(--c-ink-2);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 8px;
}

.price {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--c-ink);
  letter-spacing: -0.01em;
}

.addBtn {
  background: var(--c-accent);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background .15s, transform .1s;
  white-space: nowrap;
}

.addBtn:hover { background: var(--c-accent-hover); }
.addBtn:active { transform: scale(.95); }
.addBtn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
'@
Write-Utf8NoBom (Join-Path $root "frontend\components\products\ProductCard.module.css") $content

# ---- frontend\components\vendors\VendorRatingBar.tsx (NEU) ----
$content = @'
"use client";

import { useState } from "react";
import styles from "./VendorRatingBar.module.css";
import type { Vendor } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useReviews } from "@/lib/reviews-context";
import RatingStars from "@/components/shared/RatingStars";

interface Props {
  vendor: Vendor;
}

export default function VendorRatingBar({ vendor }: Props) {
  const { user } = useAuth();
  const { canReviewVendor, myVendorReview, submitVendorReview } = useReviews();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myReview = myVendorReview(vendor.id);
  const eligible = Boolean(user) && canReviewVendor(vendor.id);

  async function handleRate(rating: number) {
    setSubmitting(true);
    try {
      await submitVendorReview(vendor.id, rating);
      setRatingOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span className={styles.name}>{vendor.name}</span>
        {vendor.review_count > 0 ? (
          <RatingStars value={vendor.avg_rating} count={vendor.review_count} size="md" />
        ) : (
          <span className={styles.noRating}>Noch keine Bewertungen</span>
        )}
        {vendor.delivery_time_min !== null && (
          <span className={styles.meta}>{vendor.delivery_time_min} Min. Lieferzeit</span>
        )}
      </div>

      {eligible && (
        <div className={styles.action}>
          {!ratingOpen ? (
            <button type="button" className={styles.rateBtn} onClick={() => setRatingOpen(true)}>
              {myReview ? "Bewertung ändern" : "Anbieter bewerten"}
            </button>
          ) : (
            <div className={styles.rateInput}>
              <RatingStars value={myReview?.rating ?? 0} interactive size="md" onChange={handleRate} />
              {submitting && <span className={styles.hint}>Speichere…</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\components\vendors\VendorRatingBar.tsx") $content

# ---- frontend\components\vendors\VendorRatingBar.module.css (NEU) ----
$content = @'
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
  background: var(--c-surface);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-card);
  margin-bottom: 24px;
}

.info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--c-ink);
  letter-spacing: -0.01em;
}

.noRating {
  font-size: 0.78rem;
  color: var(--c-ink-2);
}

.meta {
  font-size: 0.78rem;
  color: var(--c-ink-2);
}

.rateBtn {
  background: var(--c-fill);
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--c-accent);
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s;
}

.rateBtn:hover {
  background: var(--c-fill-hover);
}

.rateInput {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint {
  font-size: 0.72rem;
  color: var(--c-ink-2);
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\components\vendors\VendorRatingBar.module.css") $content

# ---- frontend\app\page.tsx (GEAENDERT) ----
$content = @'
"use client";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { getProducts, getVendors } from "@/lib/api";
import type { Product, Vendor } from "@/lib/types";
import { deriveCategories } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";
import AuthModal from "@/components/auth/AuthModal";
import VendorRatingBar from "@/components/vendors/VendorRatingBar";

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([getVendors(), getProducts()])
      .then(([v, p]) => {
        setVendors(v);
        setProducts(p);
      })
      .catch(() => {
        setLoadError("Daten konnten nicht geladen werden. Bitte später erneut versuchen.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedVendorObj = useMemo(
    () => vendors.find((v) => v.id === selectedVendor) ?? null,
    [vendors, selectedVendor]
  );
  const categories = useMemo(() => deriveCategories(products), [products]);
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchV = selectedVendor === null || p.vendor_id === selectedVendor;
        const matchC = selectedCategory === null || p.category === selectedCategory;
        return matchV && matchC;
      }),
    [products, selectedVendor, selectedCategory]
  );

  return (
    <main className="page">
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Lieferdienst</p>
        <h1 className={styles.heroTitle}>Weniger kochen.<br />Mehr genießen.</h1>
        <p className={styles.heroSub}>
          Kuratierte Gerichte lokaler Anbieter, geliefert in Minuten statt Stunden.
        </p>
      </section>

      {loadError ? (
        <p className={styles.empty}>{loadError}</p>
      ) : (
        <>
          <div className={styles.vendorScroll}>
            <button
              className={`${styles.vendorChip} ${selectedVendor === null ? styles.vendorChipActive : ""}`}
              onClick={() => { setSelectedVendor(null); setSelectedCategory(null); }}
            >
              Alle
            </button>
            {vendors.map((v) => (
              <button
                key={v.id}
                className={`${styles.vendorChip} ${selectedVendor === v.id ? styles.vendorChipActive : ""}`}
                onClick={() => { setSelectedVendor(v.id); setSelectedCategory(null); }}
              >
                {v.name}
              </button>
            ))}
          </div>

          {selectedVendorObj && <VendorRatingBar vendor={selectedVendorObj} />}

          {categories.length > 0 && (
            <nav className={styles.catRow}>
              <button
                className={`${styles.catTab} ${selectedCategory === null ? styles.catTabActive : ""}`}
                onClick={() => setSelectedCategory(null)}
              >Alle</button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`${styles.catTab} ${selectedCategory === c ? styles.catTabActive : ""}`}
                  onClick={() => setSelectedCategory(c)}
                >{c}</button>
              ))}
            </nav>
          )}

          {isLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>Keine Gerichte gefunden.</p>
          ) : (
            <div className={styles.grid}>
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onNeedAuth={() => { setAuthTab("login"); setAuthOpen(true); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {authOpen && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setAuthOpen(false)}
          onSwitchTab={setAuthTab}
        />
      )}
    </main>
  );
}
'@
Write-Utf8NoBom (Join-Path $root "frontend\app\page.tsx") $content

Write-Host ""
Write-Host "Fertig. Naechste Schritte manuell ausfuehren:" -ForegroundColor Cyan
Write-Host "  1. git add ."
Write-Host '  2. git commit -m "Bewertungssystem fuer Anbieter und Produkte"'
Write-Host "  3. git push"
Write-Host "  4. docker-compose down -v   (WARNUNG: loescht die DB, seed.py befuellt sie neu)"
Write-Host "  5. docker-compose up --build"
