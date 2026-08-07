package com.pizzastore.android_app.network

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface UserApiService {
    @GET("api/users/me")
    suspend fun getMyProfile(): User

    @PUT("api/users/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): ApiResponse<User>

    @GET("api/users/me/addresses")
    suspend fun getMyAddresses(): List<UserAddressResponse>

    @POST("api/users/me/addresses")
    suspend fun createAddress(@Body request: AddressCreateRequest): UserAddressResponse

    @PUT("api/users/me/addresses/{id}")
    suspend fun updateAddress(@Path("id") addressId: Int, @Body request: AddressUpdateRequest): UserAddressResponse

    @DELETE("api/users/me/addresses/{id}")
    suspend fun deleteAddress(@Path("id") addressId: Int)

    @PUT("api/users/me/addresses/{id}/default")
    suspend fun setDefaultAddress(@Path("id") addressId: Int): ApiResponse<UserAddressResponse>
}
