package com.pizzastore.android_app.network

import retrofit2.http.GET

interface BannerApiService {
    @GET("api/banners/public/")
    suspend fun getActiveBanners(): List<BannerResponse>
}
