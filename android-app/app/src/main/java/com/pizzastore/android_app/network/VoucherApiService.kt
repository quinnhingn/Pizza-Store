package com.pizzastore.android_app.network

import retrofit2.http.GET
import retrofit2.http.Query

interface VoucherApiService {
    @GET("api/vouchers")
    suspend fun getActiveVouchers(): List<VoucherResponse>

    @GET("api/vouchers/my-saved-vouchers")
    suspend fun getMySavedVouchers(@Query("tab") tab: String): List<UserVoucherResponse>
}
