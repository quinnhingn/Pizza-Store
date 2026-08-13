package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.ChatApiService
import com.pizzastore.android_app.network.ChatMessageApi
import com.pizzastore.android_app.network.ChatRequest
import com.pizzastore.android_app.network.ChatResponse

class ChatRepository(private val chatApiService: ChatApiService) {
    suspend fun sendMessage(
        message: String,
        sessionId: String?,
        history: List<ChatMessageApi>
    ): Result<ChatResponse> {
        return try {
            val request = ChatRequest(
                message = message,
                session_id = sessionId,
                history = history
            )
            val response = chatApiService.sendMessage(request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
