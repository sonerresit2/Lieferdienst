from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderOut

router = APIRouter(prefix="/orders", tags=["Bestellungen"])


@router.post("/checkout", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Simuliert den Checkout: wandelt den aktuellen Warenkorb in eine Bestellung um.
    Es findet keine echte Zahlungsabwicklung statt (Checkout-Simulation lt. Anforderungen).
    """
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.user_id == current_user.id)
        .first()
    )

    if cart is None or len(cart.items) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Warenkorb ist leer.")

    # Alle Produkte im Warenkorb müssen vom selben Anbieter stammen (eine Bestellung = ein Anbieter)
    vendor_ids = {item.product.vendor_id for item in cart.items}
    if len(vendor_ids) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Der Warenkorb enthält Produkte mehrerer Anbieter. Bitte pro Anbieter separat bestellen.",
        )

    vendor_id = vendor_ids.pop()
    total_price = sum(item.product.price * item.quantity for item in cart.items)

    order = Order(
        user_id=current_user.id,
        vendor_id=vendor_id,
        status="pending",
        total_price=total_price,
    )
    db.add(order)
    db.flush()  # damit order.id verfügbar ist, bevor die Order-Items angelegt werden

    for item in cart.items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.product.price,
            )
        )

    # Warenkorb nach erfolgreichem Checkout leeren
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def list_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bestellung nicht gefunden.")
    return order
