package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.AddressCreateRequest
import com.pizzastore.android_app.network.UserAddressResponse
import com.pizzastore.android_app.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class AddressState {
    object Loading : AddressState()
    data class Success(val addresses: List<UserAddressResponse>) : AddressState()
    data class Error(val message: String) : AddressState()
}

class AddressViewModel(private val repository: UserRepository) : ViewModel() {
    private val _state = MutableStateFlow<AddressState>(AddressState.Loading)
    val state: StateFlow<AddressState> = _state

    init {
        loadAddresses()
    }

    fun loadAddresses() {
        viewModelScope.launch {
            _state.value = AddressState.Loading
            try {
                val addresses = repository.getMyAddresses()
                _state.value = AddressState.Success(addresses)
            } catch (e: Exception) {
                _state.value = AddressState.Error(e.message ?: "Lỗi tải danh sách địa chỉ")
            }
        }
    }

    fun addAddress(
        fullName: String,
        phone: String,
        addressLine: String,
        province: String,
        district: String?,
        ward: String?,
        isDefault: Boolean
    ) {
        viewModelScope.launch {
            try {
                repository.createAddress(
                    AddressCreateRequest(
                        full_name = fullName,
                        phone = phone,
                        address_line = addressLine,
                        province = province,
                        district = district,
                        ward = ward,
                        is_default = isDefault
                    )
                )
                loadAddresses() // refresh
            } catch (e: Exception) {
                _state.value = AddressState.Error(e.message ?: "Lỗi thêm địa chỉ")
            }
        }
    }

    fun setDefaultAddress(id: Int) {
        viewModelScope.launch {
            try {
                repository.setDefaultAddress(id)
                loadAddresses() // refresh
            } catch (e: Exception) {
                _state.value = AddressState.Error(e.message ?: "Lỗi đặt địa chỉ mặc định")
            }
        }
    }
}

class AddressViewModelFactory(private val repository: UserRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AddressViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AddressViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
