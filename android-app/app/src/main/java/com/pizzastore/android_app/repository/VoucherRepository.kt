package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.UserVoucherResponse
import com.pizzastore.android_app.network.VoucherApiService
import com.pizzastore.android_app.network.VoucherResponse
import retrofit2.HttpException

class VoucherRepository(private val apiService: VoucherApiService) {
    suspend fun getActiveVouchers(): Result<List<VoucherResponse>> {
        return try {
            val response = apiService.getActiveVouchers()
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }

    suspend fun getMySavedVouchers(tab: String): Result<List<UserVoucherResponse>> {
        return try {
            val response = apiService.getMySavedVouchers(tab)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
