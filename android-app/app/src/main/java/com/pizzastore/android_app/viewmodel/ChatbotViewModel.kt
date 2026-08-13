package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.ChatMessageApi
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class ChatMessage(
    val id: String,
    val sender: String, // "user" or "bot"
    val text: String,
    val products: List<Product> = emptyList(),
    val suggestions: List<String> = emptyList()
)

class ChatbotViewModel(private val repository: ChatRepository) : ViewModel() {
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _isTyping = MutableStateFlow(false)
    val isTyping: StateFlow<Boolean> = _isTyping.asStateFlow()

    private val sessionId = UUID.randomUUID().toString()

    init {
        // Initial bot message
        _messages.value = listOf(
            ChatMessage(
                id = UUID.randomUUID().toString(),
                sender = "bot",
                text = "Chào bạn! Mình là trợ lý ảo của Pizza Store. Bạn cần tìm bánh hay tư vấn gì hôm nay?",
                suggestions = listOf("Pizza Hải Sản", "Có pizza chay không?", "Dưới 150k")
            )
        )
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return

        // Add user message to UI
        val userMsg = ChatMessage(
            id = UUID.randomUUID().toString(),
            sender = "user",
            text = text
        )
        _messages.update { it + userMsg }
        
        viewModelScope.launch {
            _isTyping.value = true
            
            // Convert current messages to ChatMessageApi format for history (excluding the new message itself, which we send as 'message')
            // Wait, the API takes 'message' and 'history'.
            // Actually, we should send all previous messages as history.
            val history = _messages.value
                .filter { it.id != userMsg.id } // exclude current
                .map { 
                    ChatMessageApi(
                        role = if (it.sender == "user") "user" else "model",
                        text = it.text
                    )
                }

            val result = repository.sendMessage(
                message = text,
                sessionId = sessionId,
                history = history
            )
            
            _isTyping.value = false
            
            if (result.isSuccess) {
                val response = result.getOrThrow()
                val botMsg = ChatMessage(
                    id = UUID.randomUUID().toString(),
                    sender = "bot",
                    text = response.reply_message,
                    products = response.products,
                    suggestions = response.suggested_queries
                )
                _messages.update { it + botMsg }
            } else {
                val errorMsg = ChatMessage(
                    id = UUID.randomUUID().toString(),
                    sender = "bot",
                    text = "Xin lỗi bạn, hiện tại hệ thống AI đang bận. Vui lòng thử lại sau nhé!"
                )
                _messages.update { it + errorMsg }
            }
        }
    }
}

class ChatbotViewModelFactory(
    private val repository: ChatRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ChatbotViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ChatbotViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
