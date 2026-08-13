package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.NotificationResponse
import com.pizzastore.android_app.network.WebSocketManager
import com.pizzastore.android_app.repository.NotificationRepository
import com.pizzastore.android_app.repository.VoucherRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class NotificationUiState(
    val isLoading: Boolean = false,
    val generalNotifications: List<NotificationResponse> = emptyList(),
    val voucherNotifications: List<NotificationResponse> = emptyList(),
    val generalUnreadCount: Int = 0,
    val voucherUnreadCount: Int = 0,
    val toastMessage: String? = null,
    val savingVoucherIds: Set<Int> = emptySet(), // notification IDs currently being saved
    val savedVoucherNotificationIds: Set<Int> = emptySet() // already saved
)

class NotificationViewModel(
    private val notificationRepository: NotificationRepository,
    private val voucherRepository: VoucherRepository,
    private val webSocketManager: WebSocketManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState

    init {
        loadNotifications()
        // Listen to WebSocket events to refresh notifications in real-time
        viewModelScope.launch {
            webSocketManager.events.collect { event ->
                if (event == "order_update" || event == "new_order" || event == "notification") {
                    loadNotifications(quiet = true)
                }
            }
        }
    }

    fun loadNotifications(quiet: Boolean = false) {
        viewModelScope.launch {
            if (!quiet) _uiState.value = _uiState.value.copy(isLoading = true)
            val result = notificationRepository.getMyNotifications()
            if (result.isSuccess) {
                val all = result.getOrNull() ?: emptyList()
                val general = all.filter { it.type != "voucher_gift" }
                val voucher = all.filter { it.type == "voucher_gift" }
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    generalNotifications = general,
                    voucherNotifications = voucher,
                    generalUnreadCount = general.count { !it.is_read },
                    voucherUnreadCount = voucher.count { !it.is_read }
                )
            } else {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun markAsRead(id: Int) {
        viewModelScope.launch {
            notificationRepository.markAsRead(id)
            // Update locally for instant UI feedback
            updateLocalRead(id)
        }
    }

    fun markAllAsRead(type: String = "general") {
        viewModelScope.launch {
            notificationRepository.markAllAsRead()
            // Update local state
            if (type == "general") {
                _uiState.value = _uiState.value.copy(
                    generalNotifications = _uiState.value.generalNotifications.map { it.copy(is_read = true) },
                    generalUnreadCount = 0
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    voucherNotifications = _uiState.value.voucherNotifications.map { it.copy(is_read = true) },
                    voucherUnreadCount = 0
                )
            }
        }
    }

    fun clearAll(type: String = "general") {
        viewModelScope.launch {
            notificationRepository.clearAll(type)
            if (type == "general") {
                _uiState.value = _uiState.value.copy(
                    generalNotifications = emptyList(),
                    generalUnreadCount = 0
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    voucherNotifications = emptyList(),
                    voucherUnreadCount = 0,
                    savedVoucherNotificationIds = emptySet()
                )
            }
        }
    }

    fun saveVoucher(code: String, notificationId: Int) {
        viewModelScope.launch {
            // Mark as saving (disable button)
            _uiState.value = _uiState.value.copy(
                savingVoucherIds = _uiState.value.savingVoucherIds + notificationId
            )
            val result = voucherRepository.saveVoucher(code, notificationId)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    savingVoucherIds = _uiState.value.savingVoucherIds - notificationId,
                    savedVoucherNotificationIds = _uiState.value.savedVoucherNotificationIds + notificationId,
                    toastMessage = result.getOrNull()
                )
                // Mark notification as read (saving = reading the voucher)
                updateLocalRead(notificationId)
            } else {
                _uiState.value = _uiState.value.copy(
                    savingVoucherIds = _uiState.value.savingVoucherIds - notificationId,
                    toastMessage = result.exceptionOrNull()?.message ?: "Không thể lưu mã"
                )
            }
        }
    }

    fun clearToast() {
        _uiState.value = _uiState.value.copy(toastMessage = null)
    }

    private fun updateLocalRead(id: Int) {
        val updatedGeneral = _uiState.value.generalNotifications.map {
            if (it.id == id) it.copy(is_read = true) else it
        }
        val updatedVoucher = _uiState.value.voucherNotifications.map {
            if (it.id == id) it.copy(is_read = true) else it
        }
        _uiState.value = _uiState.value.copy(
            generalNotifications = updatedGeneral,
            voucherNotifications = updatedVoucher,
            generalUnreadCount = updatedGeneral.count { !it.is_read },
            voucherUnreadCount = updatedVoucher.count { !it.is_read }
        )
    }
}

class NotificationViewModelFactory(
    private val notificationRepository: NotificationRepository,
    private val voucherRepository: VoucherRepository,
    private val webSocketManager: WebSocketManager
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(NotificationViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return NotificationViewModel(notificationRepository, voucherRepository, webSocketManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
