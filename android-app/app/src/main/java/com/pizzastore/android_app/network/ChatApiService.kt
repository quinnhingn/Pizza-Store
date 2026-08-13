package com.pizzastore.android_app.network

import retrofit2.http.Body
import retrofit2.http.POST

interface ChatApiService {
    @POST("api/chat/")
    suspend fun sendMessage(@Body request: ChatRequest): ChatResponse
}
