package com.pizzastore.android_app.network

data class ProductSizeItem(
    val id: Int?,
    val size_name: String,
    val price_multiplier: Double,
    val extra_price: Double
)

data class ProductToppingItem(
    val id: Int?,
    val topping_name: String,
    val extra_price: Double
)

data class Product(
    val id: Int,
    val name: String,
    val description: String?,
    val price: Double,
    val image_url: String?,
    val category_id: Int?,
    val is_available: Boolean,
    val ingredients: List<String> = emptyList(),
    val sizes: List<ProductSizeItem> = emptyList(),
    val toppings: List<ProductToppingItem> = emptyList(),
    val average_rating: Double = 0.0,
    val total_reviews: Int = 0
)

data class PaginatedProductResponse(
    val items: List<Product>,
    val total_count: Int,
    val total_pages: Int,
    val page: Int,
    val page_size: Int
)
