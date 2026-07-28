package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.OrderApiService
import com.pizzastore.android_app.network.OrderCreateRequest
import com.pizzastore.android_app.network.OrderResponse
import com.pizzastore.android_app.network.VoucherValidateRequest
import com.pizzastore.android_app.network.VoucherValidateResponse
import retrofit2.HttpException
import org.json.JSONObject

class OrderRepository(private val apiService: OrderApiService) {
    
    suspend fun createOrder(request: OrderCreateRequest): Result<OrderResponse> {
        return try {
            val response = apiService.createOrder(request)
            Result.success(response)
        } catch (e: HttpException) {
            try {
                val errorBody = e.response()?.errorBody()?.string()
                if (errorBody != null) {
                    val json = JSONObject(errorBody)
                    val detail = json.optString("detail", "HTTP error: ${e.code()}")
                    Result.failure(Exception(detail))
                } else {
                    Result.failure(Exception("HTTP error: ${e.code()}"))
                }
            } catch (jsonEx: Exception) {
                Result.failure(Exception("HTTP error: ${e.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
    
    suspend fun validateVoucher(code: String, orderValue: Double): Result<VoucherValidateResponse> {
        return try {
            val request = VoucherValidateRequest(code, orderValue)
            val response = apiService.validateVoucher(request)
            Result.success(response)
        } catch (e: HttpException) {
            Result.failure(Exception("HTTP error: ${e.code()}"))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unknown error occurred"))
        }
    }
}
