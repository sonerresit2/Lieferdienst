from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(8, 2), nullable=False)
    category = Column(String(100), nullable=True)
    is_available = Column(Boolean, nullable=False, default=True)
    # Ernährungs-/Allergen-Filter, z. B. ["vegan", "glutenfrei"]. Bewusst als
    # einfaches String-Array statt eigener Tabelle: es gibt keine Beziehung,
    # die referentielle Integrität bräuchte, nur eine Menge von Merkmalen.
    dietary_tags = Column(ARRAY(String), nullable=False, server_default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)

    product = relationship("Product", back_populates="images")
