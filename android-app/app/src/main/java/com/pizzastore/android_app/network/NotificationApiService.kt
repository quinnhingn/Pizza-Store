package com.pizzastore.android_app.network

import retrofit2.http.DELETE
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query

interface NotificationApiService {
    @retrofit2.http.GET("api/notifications")
    suspend fun getMyNotifications(): List<NotificationResponse>

    @PATCH("api/notifications/{id}/read")
    suspend fun markAsRead(@Path("id") id: Int): NotificationResponse

    @PATCH("api/notifications/read-all")
    suspend fun markAllAsRead(): Map<String, String>

    @DELETE("api/notifications/clear-all")
    suspend fun clearAll(@Query("type") type: String = "general"): Map<String, String>
}
