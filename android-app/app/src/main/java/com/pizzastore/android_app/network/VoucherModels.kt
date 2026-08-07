package com.pizzastore.android_app.network

data class VoucherValidateRequest(
    val code: String,
    val order_value: Double
)

data class VoucherResponse(
    val id: Int,
    val code: String,
    val is_active: Boolean,
    val discount_percent: Double?,
    val discount_amount: Double?,
    val max_discount: Double?,
    val min_order_value: Double?,
    val start_date: String?,
    val end_date: String?
)

data class VoucherValidateResponse(
    val valid: Boolean,
    val code: String,
    val discount_amount: Double,
    val message: String,
    val voucher_details: VoucherResponse?
)
