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
