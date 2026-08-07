package com.pizzastore.android_app.network

data class UserAddressResponse(
    val id: Int,
    val full_name: String,
    val phone: String,
    val address_line: String,
    val province: String,
    val district: String?,
    val ward: String?,
    val is_default: Boolean
)

data class AddressCreateRequest(
    val full_name: String,
    val phone: String,
    val address_line: String,
    val province: String,
    val district: String?,
    val ward: String?,
    val is_default: Boolean = false
)

data class AddressUpdateRequest(
    val full_name: String? = null,
    val phone: String? = null,
    val address_line: String? = null,
    val province: String? = null,
    val district: String? = null,
    val ward: String? = null,
    val is_default: Boolean? = null
)
