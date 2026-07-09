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
