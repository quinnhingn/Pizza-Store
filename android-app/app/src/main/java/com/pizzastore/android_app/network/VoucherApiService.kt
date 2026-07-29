package com.pizzastore.android_app.network

import retrofit2.http.GET

interface VoucherApiService {
    @GET("api/vouchers")
    suspend fun getActiveVouchers(): List<VoucherResponse>
}
