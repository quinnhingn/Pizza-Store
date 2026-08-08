package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.CartItemResponse
import com.pizzastore.android_app.network.CartItemUpdateRequest
import com.pizzastore.android_app.network.UserVoucherResponse
import com.pizzastore.android_app.repository.CartRepository
import com.pizzastore.android_app.repository.OrderRepository
import com.pizzastore.android_app.repository.VoucherRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class CartState {
    object Loading : CartState()
    data class Success(
        val items: List<CartItemResponse>,
        val totalItems: Int,
        val subtotal: Double
    ) : CartState()
    data class Error(val message: String) : CartState()
}

class CartViewModel(
    private val cartRepository: CartRepository,
    private val orderRepository: OrderRepository,
    private val voucherRepository: VoucherRepository
) : ViewModel() {

    private val _state = MutableStateFlow<CartState>(CartState.Loading)
    val state: StateFlow<CartState> = _state
    
    private val _voucherCode = MutableStateFlow("")
    val voucherCode: StateFlow<String> = _voucherCode
    
    private val _discountAmount = MutableStateFlow(0.0)
    val discountAmount: StateFlow<Double> = _discountAmount
    
    private val _voucherMessage = MutableStateFlow<String?>(null)
    val voucherMessage: StateFlow<String?> = _voucherMessage

    private val _vouchers = MutableStateFlow<List<UserVoucherResponse>>(emptyList())
    val vouchers: StateFlow<List<UserVoucherResponse>> = _vouchers

    init {
        loadCart()
        loadVouchers()
        
        viewModelScope.launch {
            cartRepository.cartUpdatedEvent.collect {
                loadCart()
            }
        }
    }

    fun loadCart() {
        viewModelScope.launch {
            _state.value = CartState.Loading
            val result = cartRepository.getCart()
            if (result.isSuccess) {
                val data = result.getOrNull()
                if (data != null) {
                    _state.value = CartState.Success(data.items, data.total_items, data.subtotal)
                    // Revalidate voucher if needed when cart changes
                    if (_voucherCode.value.isNotEmpty()) {
                        applyVoucher(_voucherCode.value)
                    }
                }
            } else {
                _state.value = CartState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    private fun loadVouchers() {
        viewModelScope.launch {
            val result = voucherRepository.getMySavedVouchers("active")
            if (result.isSuccess) {
                _vouchers.value = result.getOrNull()?.filter { !it.is_used } ?: emptyList()
            }
        }
    }

    fun updateQuantity(itemId: Int, currentQuantity: Int, delta: Int) {
        val newQuantity = currentQuantity + delta
        if (newQuantity < 1) return
        
        viewModelScope.launch {
            val result = cartRepository.updateCartItem(itemId, CartItemUpdateRequest(
                quantity = newQuantity,
                size_name = null,
                toppings = null,
                note = null,
                unit_price = null
            ))
            if (result.isSuccess) {
                loadCart()
            }
        }
    }

    fun removeItem(itemId: Int) {
        viewModelScope.launch {
            val result = cartRepository.deleteCartItem(itemId)
            if (result.isSuccess) {
                loadCart()
            }
        }
    }

    fun onVoucherCodeChange(code: String) {
        _voucherCode.value = code
        if (code.isEmpty()) {
            _discountAmount.value = 0.0
            _voucherMessage.value = null
        }
    }

    fun applyVoucher(code: String) {
        val currentState = _state.value
        if (currentState !is CartState.Success) return
        
        if (code.isEmpty()) {
            _discountAmount.value = 0.0
            _voucherMessage.value = null
            return
        }

        viewModelScope.launch {
            val result = orderRepository.validateVoucher(code, currentState.subtotal)
            if (result.isSuccess) {
                val data = result.getOrNull()
                if (data != null && data.valid) {
                    _discountAmount.value = data.discount_amount
                    _voucherMessage.value = data.message
                } else {
                    _discountAmount.value = 0.0
                    _voucherMessage.value = data?.message ?: "Mã giảm giá không hợp lệ"
                }
            } else {
                _discountAmount.value = 0.0
                _voucherMessage.value = result.exceptionOrNull()?.message ?: "Lỗi kiểm tra mã"
            }
        }
    }
}

class CartViewModelFactory(
    private val cartRepository: CartRepository,
    private val orderRepository: OrderRepository,
    private val voucherRepository: VoucherRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CartViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return CartViewModel(cartRepository, orderRepository, voucherRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
