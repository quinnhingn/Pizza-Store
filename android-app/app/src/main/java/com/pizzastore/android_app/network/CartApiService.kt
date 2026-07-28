package com.pizzastore.android_app.network

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface CartApiService {
    @GET("api/cart")
    suspend fun getCart(): CartSummaryResponse
    
    @POST("api/cart/items")
    suspend fun addItemToCart(@Body request: CartItemCreateRequest): CartItemResponse
    
    @PUT("api/cart/items/{id}")
    suspend fun updateCartItem(@Path("id") id: Int, @Body request: CartItemUpdateRequest): CartItemResponse
    
    @DELETE("api/cart/items/{id}")
    suspend fun deleteCartItem(@Path("id") id: Int)
}
