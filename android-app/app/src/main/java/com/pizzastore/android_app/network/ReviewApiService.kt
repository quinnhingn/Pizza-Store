package com.pizzastore.android_app.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ReviewApiService {
    @GET("api/customer/orders/{order_id}/review-status")
    suspend fun getOrderReviewStatus(
        @Path("order_id") orderId: Int
    ): Response<OrderReviewStatusResponse>

    @POST("api/customer/orders/{order_id}/reviews")
    suspend fun submitOrderReviews(
        @Path("order_id") orderId: Int,
        @Body request: ReviewSubmitRequest
    ): Response<Map<String, Any>>

    @GET("api/public/products/{product_id}/reviews")
    suspend fun getProductReviews(
        @Path("product_id") productId: Int,
        @Query("page") page: Int = 1,
        @Query("page_size") pageSize: Int = 20
    ): Response<PaginatedPublicReviews>
}
