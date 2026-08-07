package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.CategoryApiService
import com.pizzastore.android_app.network.CategoryResponse

class CategoryRepository(private val apiService: CategoryApiService) {
    suspend fun getCategories(): Result<List<CategoryResponse>> {
        return try {
            val response = apiService.getCategories()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
