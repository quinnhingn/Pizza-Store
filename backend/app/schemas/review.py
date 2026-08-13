from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ReviewCreateItem(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    image_url: Optional[str] = None

class ReviewSubmitRequest(BaseModel):
    reviews: List[ReviewCreateItem]

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    order_id: int
    rating: int
    comment: Optional[str]
    image_url: Optional[str] = None
    is_visible: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class ReviewStatusItem(BaseModel):
    product_id: int
    is_reviewed: bool
    review: Optional[ReviewResponse] = None

class OrderReviewStatusResponse(BaseModel):
    order_id: int
    items: List[ReviewStatusItem]

class PublicReviewUser(BaseModel):
    id: int
    full_name: str
    
    class Config:
        from_attributes = True

class PublicReviewResponse(BaseModel):
    id: int
    rating: int
    comment: Optional[str]
    image_url: Optional[str] = None
    created_at: datetime
    user: PublicReviewUser

    class Config:
        from_attributes = True

class PaginatedPublicReviews(BaseModel):
    items: List[PublicReviewResponse]
    total_count: int
    total_pages: int
    page: int
    page_size: int

class AdminReviewResponse(ReviewResponse):
    user: PublicReviewUser

    class Config:
        from_attributes = True

class PaginatedAdminReviews(BaseModel):
    items: List[AdminReviewResponse]
    total_count: int
    total_pages: int
    page: int
    page_size: int

class ProductReviewAggregate(BaseModel):
    product_id: int
    product_name: str
    image_url: Optional[str] = None
    average_rating: float = 0.0
    total_reviews: int = 0
    new_reviews_count: int = 0

    class Config:
        from_attributes = True

class PaginatedProductReviewAggregates(BaseModel):
    items: List[ProductReviewAggregate]
    total_count: int
    total_pages: int
    page: int
    page_size: int
