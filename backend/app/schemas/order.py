from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductOut


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductOut


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: int
    status: str
    total_price: Decimal
    items: list[OrderItemOut] = []
