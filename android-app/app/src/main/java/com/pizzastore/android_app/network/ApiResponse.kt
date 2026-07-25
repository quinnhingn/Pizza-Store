package com.pizzastore.android_app.network

data class ApiResponse<T>(
    val status: String,
    val data: T?,
    val message: String
)
