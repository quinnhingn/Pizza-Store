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

import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.utils.GuestCartManager
import com.pizzastore.android_app.utils.TokenManager

class CartRepository(
    private val apiService: CartApiService,
    private val tokenManager: TokenManager,
    private val guestCartManager: GuestCartManager
) {
    
    private val _cartItemCount = MutableStateFlow(0)
    val cartItemCount: StateFlow<Int> = _cartItemCount.asStateFlow()
    
    private val _cartUpdatedEvent = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val cartUpdatedEvent = _cartUpdatedEvent.asSharedFlow()
    
    suspend fun getCart(): Result<CartSummaryResponse> {
        return try {
            if (tokenManager.getToken() == null) {
                val summary = guestCartManager.getCartSummary()
                _cartItemCount.value = summary.total_items
                Result.success(summary)
            } else {
                val response = apiService.getCart()
                _cartItemCount.value = response.total_items
                Result.success(response)
            }
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun addItemToCart(request: CartItemCreateRequest, product: Product? = null): Result<CartItemResponse> {
        return try {
            val response = if (tokenManager.getToken() == null) {
                guestCartManager.addItem(request, product)
            } else {
                apiService.addItemToCart(request)
            }
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
            val response = if (tokenManager.getToken() == null) {
                guestCartManager.updateItem(id, request)
            } else {
                apiService.updateCartItem(id, request)
            }
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
            if (tokenManager.getToken() == null) {
                guestCartManager.deleteItem(id)
            } else {
                apiService.deleteCartItem(id)
            }
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
            if (tokenManager.getToken() == null) {
                val summary = guestCartManager.getCartSummary()
                _cartItemCount.value = summary.total_items
            } else {
                val response = apiService.getCart()
                _cartItemCount.value = response.total_items
            }
        } catch (e: Exception) {
            // Ignore error when just refreshing count
        }
    }

    // Hàm siêu quan trọng: Đồng bộ giỏ hàng Local lên Server ngay sau khi khách hàng đăng nhập thành công
    suspend fun syncGuestCartToServer() {
        if (tokenManager.getToken() != null) {
            // Lấy toàn bộ mảng JSON giỏ hàng lưu trong SharedPreferences
            val guestItems = guestCartManager.getGuestCartItems()
            if (guestItems.isNotEmpty()) {
                try {
                    for (item in guestItems) {
                        val request = CartItemCreateRequest(
                            product_id = item.product_id,
                            size_name = item.size_name,
                            toppings = item.toppings,
                            quantity = item.quantity,
                            note = item.note,
                            unit_price = item.unit_price
                        )
                        // Gọi API đẩy từng món ăn lên Backend Database
                        apiService.addItemToCart(request)
                    }
                    // Đồng bộ xong thì xóa sạch giỏ hàng ở Local để tránh trùng lặp
                    guestCartManager.clearCart()
                    refreshCartCount()
                } catch (e: Exception) {
                    // Sync failed, log or ignore
                }
            }
        }
    }
}
