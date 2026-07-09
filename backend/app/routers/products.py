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
