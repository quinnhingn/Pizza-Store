package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.OrderCreateRequest
import com.pizzastore.android_app.repository.OrderRepository
import com.pizzastore.android_app.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class CheckoutState {
    object Idle : CheckoutState()
    object Loading : CheckoutState()
    data class Success(val orderCode: String) : CheckoutState()
    data class Error(val message: String) : CheckoutState()
}

class CheckoutViewModel(
    private val orderRepository: OrderRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _state = MutableStateFlow<CheckoutState>(CheckoutState.Idle)
    val state: StateFlow<CheckoutState> = _state
    
    private val _fullName = MutableStateFlow("")
    val fullName: StateFlow<String> = _fullName
    
    private val _phone = MutableStateFlow("")
    val phone: StateFlow<String> = _phone
    
    private val _address = MutableStateFlow("")
    val address: StateFlow<String> = _address
    
    private val _note = MutableStateFlow("")
    val note: StateFlow<String> = _note

    init {
        loadDefaultAddress()
    }

    private fun loadDefaultAddress() {
        viewModelScope.launch {
            try {
                val addresses = userRepository.getMyAddresses()
                val defaultAddress = addresses.firstOrNull { it.is_default } ?: addresses.firstOrNull()
                if (defaultAddress != null) {
                    _fullName.value = defaultAddress.full_name
                    _phone.value = defaultAddress.phone
                    
                    val fullAddress = buildString {
                        append(defaultAddress.address_line)
                        if (!defaultAddress.ward.isNullOrBlank()) append(", ${defaultAddress.ward}")
                        if (!defaultAddress.district.isNullOrBlank()) append(", ${defaultAddress.district}")
                        append(", ${defaultAddress.province}")
                    }
                    _address.value = fullAddress
                }
            } catch (e: Exception) {
                // Ignore, let user fill manually if fetch fails
            }
        }
    }

    fun onFullNameChange(value: String) { _fullName.value = value }
    fun onPhoneChange(value: String) { _phone.value = value }
    fun onAddressChange(value: String) { _address.value = value }
    fun onNoteChange(value: String) { _note.value = value }

    fun placeOrder(voucherCode: String?) {
        if (_fullName.value.isBlank() || _phone.value.isBlank() || _address.value.isBlank()) {
            _state.value = CheckoutState.Error("Vui lòng điền đầy đủ thông tin giao hàng")
            return
        }

        viewModelScope.launch {
            _state.value = CheckoutState.Loading
            val request = OrderCreateRequest(
                voucher_code = if (voucherCode.isNullOrBlank()) null else voucherCode,
                shipping_full_name = _fullName.value,
                shipping_phone = _phone.value,
                shipping_address = _address.value,
                shipping_address_id = null,
                note = _note.value
            )
            val result = orderRepository.createOrder(request)
            if (result.isSuccess) {
                val data = result.getOrNull()
                _state.value = CheckoutState.Success(data?.order_code ?: "UNKNOWN")
            } else {
                _state.value = CheckoutState.Error(result.exceptionOrNull()?.message ?: "Lỗi khi đặt hàng")
            }
        }
    }
    
    fun resetState() {
        _state.value = CheckoutState.Idle
    }
}

class CheckoutViewModelFactory(
    private val orderRepository: OrderRepository,
    private val userRepository: UserRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CheckoutViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return CheckoutViewModel(orderRepository, userRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
