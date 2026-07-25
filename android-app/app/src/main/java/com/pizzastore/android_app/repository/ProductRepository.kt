package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.PaginatedProductResponse
import com.pizzastore.android_app.network.ProductApiService
import retrofit2.HttpException

class ProductRepository(private val apiService: ProductApiService) {
    
    suspend fun getProducts(page: Int = 1): Result<PaginatedProductResponse> {
        return try {
            val response = apiService.getProducts(page = page, pageSize = 20)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
