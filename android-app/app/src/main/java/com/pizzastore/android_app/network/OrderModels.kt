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
    val created_at: String
)
