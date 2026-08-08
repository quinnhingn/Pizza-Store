package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.UserVoucherResponse
import com.pizzastore.android_app.repository.VoucherRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class VoucherWalletState {
    object Loading : VoucherWalletState()
    data class Success(val vouchers: List<UserVoucherResponse>) : VoucherWalletState()
    data class Error(val message: String) : VoucherWalletState()
}

class VoucherWalletViewModel(private val repository: VoucherRepository) : ViewModel() {
    private val _state = MutableStateFlow<VoucherWalletState>(VoucherWalletState.Loading)
    val state: StateFlow<VoucherWalletState> = _state

    init {
        loadVouchers("active")
    }

    fun loadVouchers(tab: String) {
        viewModelScope.launch {
            _state.value = VoucherWalletState.Loading
            val result = repository.getMySavedVouchers(tab)
            if (result.isSuccess) {
                _state.value = VoucherWalletState.Success(result.getOrNull() ?: emptyList())
            } else {
                _state.value = VoucherWalletState.Error(result.exceptionOrNull()?.message ?: "Lỗi tải ví voucher")
            }
        }
    }
}

class VoucherWalletViewModelFactory(private val repository: VoucherRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(VoucherWalletViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return VoucherWalletViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
