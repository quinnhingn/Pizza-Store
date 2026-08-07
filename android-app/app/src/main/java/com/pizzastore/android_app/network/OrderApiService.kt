package com.pizzastore.android_app.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface OrderApiService {
    @POST("api/orders")
    suspend fun createOrder(@Body request: OrderCreateRequest): OrderResponse
    
    @POST("api/vouchers/validate")
    suspend fun validateVoucher(@Body request: VoucherValidateRequest): VoucherValidateResponse

    @GET("api/orders/my-orders")
    suspend fun getMyOrders(): List<OrderResponse>

    @PUT("api/orders/{id}/cancel")
    suspend fun cancelOrder(@Path("id") orderId: Int): OrderResponse

    @PUT("api/orders/{id}/confirm-received")
    suspend fun confirmOrderReceived(@Path("id") orderId: Int): OrderResponse
}
