from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    rating = Column(Numeric(2, 1), nullable=True)
    delivery_fee = Column(Numeric(6, 2), nullable=False, default=0)
    delivery_time_min = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="vendor")
    orders = relationship("Order", back_populates="vendor")
