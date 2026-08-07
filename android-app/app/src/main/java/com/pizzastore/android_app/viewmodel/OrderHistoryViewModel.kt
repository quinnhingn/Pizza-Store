package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.OrderResponse
import com.pizzastore.android_app.repository.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class OrderHistoryState {
    object Loading : OrderHistoryState()
    data class Success(val orders: List<OrderResponse>) : OrderHistoryState()
    data class Error(val message: String) : OrderHistoryState()
}

class OrderHistoryViewModel(private val repository: OrderRepository) : ViewModel() {
    private val _state = MutableStateFlow<OrderHistoryState>(OrderHistoryState.Loading)
    val state: StateFlow<OrderHistoryState> = _state

    init {
        loadOrders()
    }

    fun loadOrders() {
        viewModelScope.launch {
            _state.value = OrderHistoryState.Loading
            val result = repository.getMyOrders()
            if (result.isSuccess) {
                _state.value = OrderHistoryState.Success(result.getOrNull() ?: emptyList())
            } else {
                _state.value = OrderHistoryState.Error(result.exceptionOrNull()?.message ?: "Lỗi tải lịch sử đơn hàng")
            }
        }
    }

    fun cancelOrder(orderId: Int) {
        viewModelScope.launch {
            val result = repository.cancelOrder(orderId)
            if (result.isSuccess) {
                loadOrders() // refresh
            } else {
                // Ideally show a toast or snackbar
                // For now, we can set error state, but it might replace the list
                // We'll keep it simple and just reload
                loadOrders()
            }
        }
    }

    fun confirmOrderReceived(orderId: Int) {
        viewModelScope.launch {
            val result = repository.confirmOrderReceived(orderId)
            if (result.isSuccess) {
                loadOrders() // refresh
            }
        }
    }
}

class OrderHistoryViewModelFactory(private val repository: OrderRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(OrderHistoryViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return OrderHistoryViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
