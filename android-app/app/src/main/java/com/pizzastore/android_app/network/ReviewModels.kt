package com.pizzastore.android_app.network

data class ReviewStatusItem(
    val product_id: Int,
    val is_reviewed: Boolean,
    val review: ReviewDetail? = null
)

data class ReviewDetail(
    val id: Int,
    val user_id: Int,
    val product_id: Int,
    val order_id: Int?,
    val rating: Int,
    val comment: String?,
    val image_url: String?,
    val created_at: String
)

data class OrderReviewStatusResponse(
    val order_id: Int,
    val items: List<ReviewStatusItem>
)

data class ReviewSubmitItem(
    val product_id: Int,
    val rating: Int,
    val comment: String?,
    val image_url: String?
)

data class ReviewSubmitRequest(
    val reviews: List<ReviewSubmitItem>
)

data class ReviewUser(
    val id: Int,
    val full_name: String,
    val email: String
)

data class PublicReviewItem(
    val id: Int,
    val user_id: Int,
    val product_id: Int,
    val rating: Int,
    val comment: String?,
    val image_url: String?,
    val created_at: String,
    val user: ReviewUser? = null
)

data class PaginatedPublicReviews(
    val items: List<PublicReviewItem>,
    val total_count: Int,
    val total_pages: Int,
    val page: Int,
    val page_size: Int
)

data class UploadResponseData(
    val url: String,
    val public_id: String,
    val provider: String
)

data class UploadResponse(
    val status: String,
    val data: UploadResponseData,
    val message: String
)
