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
    rating: Optional[Decimal] = None
