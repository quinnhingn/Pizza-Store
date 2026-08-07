package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.BannerApiService
import com.pizzastore.android_app.network.BannerResponse

class BannerRepository(private val apiService: BannerApiService) {
    suspend fun getActiveBanners(): Result<List<BannerResponse>> {
        return try {
            val response = apiService.getActiveBanners()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
