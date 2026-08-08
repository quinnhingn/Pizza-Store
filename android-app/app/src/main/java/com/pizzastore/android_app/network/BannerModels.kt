package com.pizzastore.android_app.network

data class BannerResponse(
    val id: Int,
    val title: String?,
    val description: String?,
    val image_url: String,
    val link_url: String?,
    val is_active: Boolean
)
