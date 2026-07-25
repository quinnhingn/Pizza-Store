package com.pizzastore.android_app.network

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ProductApiService {
    @GET("api/public/products")
    suspend fun getProducts(
        @Query("page") page: Int = 1,
        @Query("page_size") pageSize: Int = 20
    ): PaginatedProductResponse
    
    @GET("api/public/products/{id}")
    suspend fun getProductById(@Path("id") id: Int): Product
}
