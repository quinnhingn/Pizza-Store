package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.UserLogin
import com.pizzastore.android_app.repository.AuthRepository
import com.pizzastore.android_app.repository.CartRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    object Success : LoginState()
    data class Error(val message: String) : LoginState()
}

class LoginViewModel(
    private val authRepository: AuthRepository,
    private val cartRepository: CartRepository
) : ViewModel() {
    
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = LoginState.Loading
            val result = authRepository.login(UserLogin(email, password))
            if (result.isSuccess) {
                // Sync guest cart to server
                cartRepository.syncGuestCartToServer()
                _loginState.value = LoginState.Success
            } else {
                _loginState.value = LoginState.Error(result.exceptionOrNull()?.message ?: "Login failed")
            }
        }
    }
    
    fun resetState() {
        _loginState.value = LoginState.Idle
    }
}

class LoginViewModelFactory(
    private val authRepository: AuthRepository,
    private val cartRepository: CartRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LoginViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return LoginViewModel(authRepository, cartRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
