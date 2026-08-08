package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.OrderCreateRequest
import com.pizzastore.android_app.network.UserAddressResponse
import com.pizzastore.android_app.repository.CartRepository
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
    private val userRepository: UserRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _state = MutableStateFlow<CheckoutState>(CheckoutState.Idle)
    val state: StateFlow<CheckoutState> = _state

    private val _addresses = MutableStateFlow<List<UserAddressResponse>>(emptyList())
    val addresses: StateFlow<List<UserAddressResponse>> = _addresses

    private val _selectedAddressId = MutableStateFlow<Int?>(null)
    val selectedAddressId: StateFlow<Int?> = _selectedAddressId

    private val _useCustomAddress = MutableStateFlow(false)
    val useCustomAddress: StateFlow<Boolean> = _useCustomAddress

    // Custom address fields
    private val _fullName = MutableStateFlow("")
    val fullName: StateFlow<String> = _fullName

    private val _phone = MutableStateFlow("")
    val phone: StateFlow<String> = _phone

    private val _addressLine = MutableStateFlow("")
    val addressLine: StateFlow<String> = _addressLine

    // Payment method: "cod" or "bank"
    private val _paymentMethod = MutableStateFlow("cod")
    val paymentMethod: StateFlow<String> = _paymentMethod

    private val _note = MutableStateFlow("")
    val note: StateFlow<String> = _note

    init {
        loadAddresses()
    }

    private fun loadAddresses() {
        viewModelScope.launch {
            try {
                // Fetch profile to preset custom name
                val user = try { userRepository.getMyProfile() } catch (e: Exception) { null }
                if (user != null) {
                    if (_fullName.value.isEmpty()) _fullName.value = user.full_name
                }

                val addressList = userRepository.getMyAddresses()
                _addresses.value = addressList

                val defaultAddr = addressList.find { it.is_default }
                if (defaultAddr != null) {
                    _selectedAddressId.value = defaultAddr.id
                    _useCustomAddress.value = false
                } else if (addressList.isNotEmpty()) {
                    _selectedAddressId.value = addressList.first().id
                    _useCustomAddress.value = false
                } else {
                    _useCustomAddress.value = true
                }
            } catch (e: Exception) {
                // Ignore, let user fill manually if fetch fails
                _useCustomAddress.value = true
            }
        }
    }

    fun selectAddress(id: Int?) {
        if (id != null) {
            _selectedAddressId.value = id
            _useCustomAddress.value = false
        } else {
            _selectedAddressId.value = null
            _useCustomAddress.value = true
        }
    }

    fun onFullNameChange(value: String) { _fullName.value = value }
    fun onPhoneChange(value: String) { _phone.value = value }
    fun onAddressLineChange(value: String) { _addressLine.value = value }
    fun onPaymentMethodChange(method: String) { _paymentMethod.value = method }
    fun onNoteChange(value: String) { _note.value = value }

    fun placeOrder(voucherCode: String?) {
        if (_state.value is CheckoutState.Loading) return

        val finalName: String
        val finalPhone: String
        val finalAddress: String
        val finalAddressId: Int?

        if (!_useCustomAddress.value && _selectedAddressId.value != null) {
            val addrObj = _addresses.value.find { it.id == _selectedAddressId.value }
            if (addrObj == null) {
                _state.value = CheckoutState.Error("Vui lòng chọn địa chỉ giao hàng hợp lệ.")
                return
            }
            finalName = addrObj.full_name
            finalPhone = addrObj.phone
            val addressParts = listOfNotNull(addrObj.address_line, addrObj.ward, addrObj.district, addrObj.province).filter { it.isNotEmpty() }
            finalAddress = addressParts.joinToString(", ")
            finalAddressId = addrObj.id
        } else {
            finalName = _fullName.value.trim()
            finalPhone = _phone.value.trim()
            finalAddress = _addressLine.value.trim()

            if (finalName.isBlank() || finalPhone.isBlank() || finalAddress.isBlank()) {
                _state.value = CheckoutState.Error("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.")
                return
            }
            finalAddressId = null
        }

        viewModelScope.launch {
            _state.value = CheckoutState.Loading
            val request = OrderCreateRequest(
                voucher_code = voucherCode?.takeIf { it.isNotBlank() },
                shipping_full_name = finalName,
                shipping_phone = finalPhone,
                shipping_address = finalAddress,
                shipping_address_id = finalAddressId,
                note = _note.value.trim().takeIf { it.isNotEmpty() }
            )

            val result = orderRepository.createOrder(request)
            if (result.isSuccess) {
                // Load cart to clear it out on CartScreen next time
                try { cartRepository.getCart() } catch (e: Exception) {}
                
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
    private val userRepository: UserRepository,
    private val cartRepository: CartRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CheckoutViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return CheckoutViewModel(orderRepository, userRepository, cartRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
