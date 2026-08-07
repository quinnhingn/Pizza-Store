package com.pizzastore.android_app.repository

import com.pizzastore.android_app.network.AddressCreateRequest
import com.pizzastore.android_app.network.AddressUpdateRequest
import com.pizzastore.android_app.network.ApiResponse
import com.pizzastore.android_app.network.User
import com.pizzastore.android_app.network.UserAddressResponse
import com.pizzastore.android_app.network.UserApiService

class UserRepository(private val apiService: UserApiService) {

    suspend fun getMyProfile(): User {
        return apiService.getMyProfile()
    }

    suspend fun updateProfile(request: com.pizzastore.android_app.network.UpdateProfileRequest): ApiResponse<User> {
        return apiService.updateProfile(request)
    }

    suspend fun getMyAddresses(): List<UserAddressResponse> {
        return apiService.getMyAddresses()
    }

    suspend fun createAddress(request: AddressCreateRequest): UserAddressResponse {
        return apiService.createAddress(request)
    }

    suspend fun updateAddress(id: Int, request: AddressUpdateRequest): UserAddressResponse {
        return apiService.updateAddress(id, request)
    }

    suspend fun deleteAddress(id: Int) {
        apiService.deleteAddress(id)
    }

    suspend fun setDefaultAddress(id: Int): ApiResponse<UserAddressResponse> {
        return apiService.setDefaultAddress(id)
    }
}
