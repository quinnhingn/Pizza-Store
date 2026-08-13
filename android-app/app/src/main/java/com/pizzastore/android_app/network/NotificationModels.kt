package com.pizzastore.android_app.network

data class NotificationResponse(
    val id: Int,
    val user_id: Int,
    val title: String,
    val message: String,
    val type: String, // "order_update", "voucher_gift", "general", etc.
    val is_read: Boolean,
    val reference_code: String?,
    val created_at: String
)

data class SaveVoucherRequest(
    val code: String,
    val notification_id: Int?
)
