package com.pizzastore.android_app.network

data class ChatMessageApi(
    val role: String,
    val text: String
)

data class ChatRequest(
    val message: String,
    val session_id: String?,
    val history: List<ChatMessageApi>? = emptyList()
)

data class ChatResponse(
    val reply_message: String,
    val products: List<Product> = emptyList(),
    val suggested_queries: List<String> = emptyList()
)
