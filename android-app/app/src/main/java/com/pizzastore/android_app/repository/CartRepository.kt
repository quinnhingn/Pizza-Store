package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.CartApiService
import com.pizzastore.android_app.network.CartItemCreateRequest
import com.pizzastore.android_app.network.CartItemResponse
import com.pizzastore.android_app.network.CartItemUpdateRequest
import com.pizzastore.android_app.network.CartSummaryResponse
import retrofit2.HttpException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class CartRepository(private val apiService: CartApiService) {
    
    private val _cartItemCount = MutableStateFlow(0)
    val cartItemCount: StateFlow<Int> = _cartItemCount.asStateFlow()
    
    private val _cartUpdatedEvent = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val cartUpdatedEvent = _cartUpdatedEvent.asSharedFlow()
    
    suspend fun getCart(): Result<CartSummaryResponse> {
        return try {
            val response = apiService.getCart()
            _cartItemCount.value = response.total_items
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
            _cartUpdatedEvent.tryEmit(Unit)
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
            _cartUpdatedEvent.tryEmit(Unit)
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
            _cartUpdatedEvent.tryEmit(Unit)
            Result.success(Unit)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun refreshCartCount() {
        try {
            val response = apiService.getCart()
            _cartItemCount.value = response.total_items
        } catch (e: Exception) {
            // Ignore error when just refreshing count
        }
    }
}
