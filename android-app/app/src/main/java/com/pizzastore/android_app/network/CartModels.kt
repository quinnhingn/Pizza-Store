package com.pizzastore.android_app.network

data class CartItemCreateRequest(
    val product_id: Int,
    val size_name: String?,
    val toppings: List<ProductToppingItem>?,
    val quantity: Int,
    val note: String?,
    val unit_price: Double
)

data class CartItemUpdateRequest(
    val quantity: Int?,
    val size_name: String?,
    val toppings: List<ProductToppingItem>?,
    val note: String?,
    val unit_price: Double?
)

data class CartItemResponse(
    val id: Int,
    val user_id: Int,
    val product_id: Int,
    val size_name: String?,
    val toppings: List<ProductToppingItem>?,
    val quantity: Int,
    val note: String?,
    val unit_price: Double,
    val total_price: Double,
    val product: Product? // Usually eager loaded, but maybe not in CartItem?
)

data class CartSummaryResponse(
    val items: List<CartItemResponse>,
    val total_items: Int,
    val subtotal: Double
)
