package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.OrderResponse
import com.pizzastore.android_app.network.WebSocketManager
import com.pizzastore.android_app.repository.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class OrderHistoryState {
    object Loading : OrderHistoryState()
    data class Success(val orders: List<OrderResponse>) : OrderHistoryState()
    data class Error(val message: String) : OrderHistoryState()
}

class OrderHistoryViewModel(
    private val repository: OrderRepository,
    private val webSocketManager: WebSocketManager
) : ViewModel() {

    private val _allOrders = MutableStateFlow<List<OrderResponse>>(emptyList())

    private val _state = MutableStateFlow<OrderHistoryState>(OrderHistoryState.Loading)
    val state: StateFlow<OrderHistoryState> = _state

    private val _activeTab = MutableStateFlow("all")
    val activeTab: StateFlow<String> = _activeTab

    private var currentScreenType: String = "tracking" // "tracking" or "history"

    private val _notification = MutableStateFlow<String?>(null)
    val notification: StateFlow<String?> = _notification

    init {
        loadOrders()
        observeWebSocket()
    }

    private fun observeWebSocket() {
        viewModelScope.launch {
            webSocketManager.events.collect { eventType ->
                if (eventType == "order_update" || eventType == "new_order") {
                    _notification.value = "Đơn hàng của bạn vừa được cập nhật trạng thái!"
                    loadOrders(silent = true)
                }
            }
        }
    }

    fun loadOrders(silent: Boolean = false) {
        viewModelScope.launch {
            if (!silent) _state.value = OrderHistoryState.Loading
            val result = repository.getMyOrders()
            if (result.isSuccess) {
                _allOrders.value = result.getOrNull() ?: emptyList()
                applyFilter()
            } else {
                if (!silent) {
                    _state.value = OrderHistoryState.Error(result.exceptionOrNull()?.message ?: "Lỗi tải lịch sử đơn hàng")
                }
            }
        }
    }

    fun setTab(tabId: String) {
        _activeTab.value = tabId
        applyFilter()
    }

    fun setScreenType(type: String) {
        currentScreenType = type
        applyFilter()
    }

    private fun applyFilter() {
        val orders = _allOrders.value
        val screenFiltered = if (currentScreenType == "tracking") {
            orders.filter { it.status in listOf("pending", "confirmed", "shipping") }
        } else {
            orders.filter { it.status in listOf("completed", "cancelled") }
        }

        val filtered = if (_activeTab.value == "all") {
            screenFiltered
        } else {
            screenFiltered.filter { it.status == _activeTab.value }
        }
        _state.value = OrderHistoryState.Success(filtered)
    }

    fun clearNotification() {
        _notification.value = null
    }

    fun cancelOrder(orderId: Int) {
        viewModelScope.launch {
            val result = repository.cancelOrder(orderId)
            if (result.isSuccess) {
                loadOrders(silent = true) // refresh
            } else {
                loadOrders(silent = true)
            }
        }
    }

    fun confirmOrderReceived(orderId: Int) {
        viewModelScope.launch {
            val result = repository.confirmOrderReceived(orderId)
            if (result.isSuccess) {
                loadOrders(silent = true) // refresh
            }
        }
    }
}

class OrderHistoryViewModelFactory(
    private val repository: OrderRepository,
    private val webSocketManager: WebSocketManager
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(OrderHistoryViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return OrderHistoryViewModel(repository, webSocketManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
