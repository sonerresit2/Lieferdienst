from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class ReviewCreate(BaseModel):
    vendor_id: Optional[int] = None
    product_id: Optional[int] = None
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def check_exactly_one_target(self):
        if (self.vendor_id is None) == (self.product_id is None):
            raise ValueError(
                "Es muss entweder vendor_id oder product_id angegeben werden (genau eines von beiden)."
            )
        return self


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: Optional[int] = None
    product_id: Optional[int] = None
    order_id: int
    rating: int
    comment: Optional[str] = None
