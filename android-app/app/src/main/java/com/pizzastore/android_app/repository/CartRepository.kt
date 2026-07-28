package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.CartApiService
import com.pizzastore.android_app.network.CartItemCreateRequest
import com.pizzastore.android_app.network.CartItemResponse
import com.pizzastore.android_app.network.CartItemUpdateRequest
import com.pizzastore.android_app.network.CartSummaryResponse
import retrofit2.HttpException

class CartRepository(private val apiService: CartApiService) {
    
    suspend fun getCart(): Result<CartSummaryResponse> {
        return try {
            val response = apiService.getCart()
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun addItemToCart(request: CartItemCreateRequest): Result<CartItemResponse> {
        return try {
            val response = apiService.addItemToCart(request)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun updateCartItem(id: Int, request: CartItemUpdateRequest): Result<CartItemResponse> {
        return try {
            val response = apiService.updateCartItem(id, request)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun deleteCartItem(id: Int): Result<Unit> {
        return try {
            apiService.deleteCartItem(id)
            Result.success(Unit)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
