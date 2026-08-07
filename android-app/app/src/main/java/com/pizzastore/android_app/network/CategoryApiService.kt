package com.pizzastore.android_app.network

import retrofit2.http.GET

interface CategoryApiService {
    @GET("api/categories")
    suspend fun getCategories(): List<CategoryResponse>
}
