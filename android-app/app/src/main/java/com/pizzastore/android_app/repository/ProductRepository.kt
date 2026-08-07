package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.PaginatedProductResponse
import com.pizzastore.android_app.network.ProductApiService
import retrofit2.HttpException

class ProductRepository(private val apiService: ProductApiService) {
    
    suspend fun getProducts(page: Int, categoryId: Int? = null, pageSize: Int = 20): Result<PaginatedProductResponse> {
        return try {
            val response = apiService.getProducts(page = page, pageSize = pageSize, categoryId = categoryId)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun getProductById(id: Int): Result<com.pizzastore.android_app.network.Product> {
        return try {
            val response = apiService.getProductById(id)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
