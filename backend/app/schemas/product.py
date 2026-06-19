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
