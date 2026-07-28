package com.pizzastore.android_app.network

import com.pizzastore.android_app.utils.TokenManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val requestBuilder = chain.request().newBuilder()

        // If token is found, add it to the header
        tokenManager.getToken()?.let {
            requestBuilder.addHeader("Authorization", "Bearer $it")
        }

        val response = chain.proceed(requestBuilder.build())
        
        if (response.code == 401) {
            tokenManager.notifySessionExpired()
        }
        
        return response
    }
}
