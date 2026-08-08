package com.pizzastore.android_app.network

data class OrderCreateRequest(
    val voucher_code: String?,
    val shipping_full_name: String,
    val shipping_address: String,
    val shipping_phone: String,
    val shipping_address_id: Int?,
    val note: String?
)

data class OrderResponse(
    val id: Int,
    val user_id: Int,
    val order_code: String,
    val total_amount: Double,
    val discount_amount: Double,
    val voucher_code: String?,
    val status: String,
    val shipping_full_name: String,
    val shipping_address: String,
    val shipping_phone: String,
    val note: String?,
    val created_at: String,
    val updated_at: String? = null,
    val customer_confirmed: Boolean = false,
    val has_reviews: Boolean = false,
    val items: List<OrderItemResponse>? = null
)

data class OrderItemResponse(
    val id: Int,
    val product: com.pizzastore.android_app.network.Product?,
    val quantity: Int,
    val unit_price: Double,
    val size_name: String?,
    val toppings: List<com.google.gson.JsonElement>? // Depending on API response, could be list of objects or strings
)
