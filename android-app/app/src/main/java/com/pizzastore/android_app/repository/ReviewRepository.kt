package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.OrderReviewStatusResponse
import com.pizzastore.android_app.network.PaginatedPublicReviews
import com.pizzastore.android_app.network.ReviewApiService
import com.pizzastore.android_app.network.ReviewSubmitRequest
import com.pizzastore.android_app.network.UploadApiService
import com.pizzastore.android_app.network.UploadResponse
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class ReviewRepository(
    private val reviewApiService: ReviewApiService,
    private val uploadApiService: UploadApiService
) {
    suspend fun getOrderReviewStatus(orderId: Int): Result<OrderReviewStatusResponse> {
        return try {
            val response = reviewApiService.getOrderReviewStatus(orderId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitOrderReviews(orderId: Int, request: ReviewSubmitRequest): Result<Map<String, Any>> {
        return try {
            val response = reviewApiService.submitOrderReviews(orderId, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProductReviews(productId: Int, page: Int = 1, pageSize: Int = 20): Result<PaginatedPublicReviews> {
        return try {
            val response = reviewApiService.getProductReviews(productId, page, pageSize)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadReviewImage(file: File): Result<UploadResponse> {
        return try {
            val requestFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            val response = uploadApiService.uploadReviewImage(body)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
