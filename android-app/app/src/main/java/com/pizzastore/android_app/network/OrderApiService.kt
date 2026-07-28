package com.pizzastore.android_app.network

import retrofit2.http.Body
import retrofit2.http.POST

interface OrderApiService {
    @POST("api/orders")
    suspend fun createOrder(@Body request: OrderCreateRequest): OrderResponse
    
    @POST("api/vouchers/validate")
    suspend fun validateVoucher(@Body request: VoucherValidateRequest): VoucherValidateResponse
}
