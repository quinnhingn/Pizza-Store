package com.pizzastore.android_app.network

data class UserLogin(val email: String, val password: String)

data class UserRegister(
    val email: String,
    val password: String,
    val full_name: String,
    val phone: String? = null
)

data class LoginData(
    val access_token: String,
    val token_type: String,
    val user: User
)

data class User(
    val id: Int,
    val email: String,
    val full_name: String,
    val role: String
)

data class UpdateProfileRequest(
    val full_name: String
)
