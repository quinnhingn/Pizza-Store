package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.AuthApiService
import com.pizzastore.android_app.network.UserLogin
import com.pizzastore.android_app.utils.TokenManager
import retrofit2.HttpException

class AuthRepository(
    private val apiService: AuthApiService,
    private val tokenManager: TokenManager
) {
    suspend fun login(userLogin: UserLogin): Result<String> {
        return try {
            val response = apiService.login(userLogin)
            if (response.status == "success" && response.data != null) {
                // Save token
                tokenManager.saveToken(response.data.access_token)
                Result.success("Login successful")
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    fun logout() {
        tokenManager.clearToken()
    }
}
