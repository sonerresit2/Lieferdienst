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
