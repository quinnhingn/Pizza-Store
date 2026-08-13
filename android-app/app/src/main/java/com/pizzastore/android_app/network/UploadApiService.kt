package com.pizzastore.android_app.network

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface UploadApiService {
    @Multipart
    @POST("api/upload/review-image")
    suspend fun uploadReviewImage(
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>
}
