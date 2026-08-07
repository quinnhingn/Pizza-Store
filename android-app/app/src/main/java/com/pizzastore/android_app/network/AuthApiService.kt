package com.pizzastore.android_app.network

import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: UserLogin): ApiResponse<LoginData>

    @POST("api/auth/register")
    suspend fun register(@Body request: UserRegister): ApiResponse<User>
}
