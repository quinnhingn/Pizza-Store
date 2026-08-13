package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.NotificationApiService
import com.pizzastore.android_app.network.NotificationResponse

class NotificationRepository(private val apiService: NotificationApiService) {

    suspend fun getMyNotifications(): Result<List<NotificationResponse>> {
        return try {
            val list = apiService.getMyNotifications()
            Result.success(list)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAsRead(id: Int): Result<NotificationResponse> {
        return try {
            val updated = apiService.markAsRead(id)
            Result.success(updated)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllAsRead(): Result<Unit> {
        return try {
            apiService.markAllAsRead()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun clearAll(type: String = "general"): Result<Unit> {
        return try {
            apiService.clearAll(type)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
