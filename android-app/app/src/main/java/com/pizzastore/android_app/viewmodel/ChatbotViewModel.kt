package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.Product
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChatMessage(
    val id: String,
    val sender: String, // "user" or "bot"
    val text: String,
    val products: List<Product> = emptyList(),
    val suggestions: List<String> = emptyList()
)

class ChatbotViewModel : ViewModel() {
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _isTyping = MutableStateFlow(false)
    val isTyping: StateFlow<Boolean> = _isTyping.asStateFlow()

    init {
        // Initial bot message
        _messages.value = listOf(
            ChatMessage(
                id = "1",
                sender = "bot",
                text = "Chào bạn! Mình là trợ lý ảo của Pizza Store. Bạn cần tìm bánh hay tư vấn gì hôm nay?",
                suggestions = listOf("Pizza Hải Sản", "Có pizza chay không?", "Dưới 150k")
            )
        )
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return

        // Add user message
        val userMsg = ChatMessage(
            id = System.currentTimeMillis().toString(),
            sender = "user",
            text = text
        )
        _messages.update { it + userMsg }
        
        // Simulate typing and bot response
        viewModelScope.launch {
            _isTyping.value = true
            delay(1500) // Mock network delay
            _isTyping.value = false
            
            // Mock responses based on keywords
            val botResponse = if (text.contains("hải sản", ignoreCase = true)) {
                ChatMessage(
                    id = (System.currentTimeMillis() + 1).toString(),
                    sender = "bot",
                    text = "Gửi bạn một vài gợi ý tuyệt vời cho Pizza Hải Sản nhé! Bạn có thể chọn loại đế mỏng hoặc dày.",
                    products = listOf(
                        Product(id = 1, name = "Pizza Hải Sản Nhiệt Đới", description = "Tôm, mực, dứa", price = 169000.0, image_url = "https://via.placeholder.com/150", category_id = 1, is_available = true, average_rating = 4.8, total_reviews = 120),
                        Product(id = 2, name = "Pizza Hải Sản Sốt Pesto", description = "Tôm, mực, sốt pesto xanh", price = 179000.0, image_url = "https://via.placeholder.com/150", category_id = 1, is_available = true, average_rating = 4.5, total_reviews = 45)
                    ),
                    suggestions = listOf("Cỡ lớn", "Thêm phô mai")
                )
            } else if (text.contains("chay", ignoreCase = true)) {
                ChatMessage(
                    id = (System.currentTimeMillis() + 1).toString(),
                    sender = "bot",
                    text = "Chúng tôi có các món chay ngon miệng phù hợp cho bạn đây:",
                    products = listOf(
                        Product(id = 3, name = "Pizza Rau Củ", description = "Hành tây, ớt chuông, nấm", price = 129000.0, image_url = "https://via.placeholder.com/150", category_id = 1, is_available = true, average_rating = 4.2, total_reviews = 30)
                    ),
                    suggestions = listOf("Nước ép trái cây")
                )
            } else {
                ChatMessage(
                    id = (System.currentTimeMillis() + 1).toString(),
                    sender = "bot",
                    text = "Cảm ơn bạn. Mình ghi nhận thông tin và sẽ tư vấn thêm các chương trình khuyến mãi nếu bạn cần nhé!",
                    suggestions = listOf("Khuyến mãi hôm nay", "Giao hàng bao lâu?")
                )
            }
            
            _messages.update { it + botResponse }
        }
    }
}
