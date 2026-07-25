package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.repository.ProductRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class HomeState {
    object Loading : HomeState()
    data class Success(val products: List<Product>) : HomeState()
    data class Error(val message: String) : HomeState()
}

class HomeViewModel(private val repository: ProductRepository) : ViewModel() {
    private val _homeState = MutableStateFlow<HomeState>(HomeState.Loading)
    val homeState: StateFlow<HomeState> = _homeState
    
    init {
        loadProducts()
    }
    
    fun loadProducts() {
        viewModelScope.launch {
            _homeState.value = HomeState.Loading
            val result = repository.getProducts(1)
            if (result.isSuccess) {
                _homeState.value = HomeState.Success(result.getOrNull()?.items ?: emptyList())
            } else {
                _homeState.value = HomeState.Error(result.exceptionOrNull()?.message ?: "Failed to load products")
            }
        }
    }
}

class HomeViewModelFactory(private val repository: ProductRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(HomeViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return HomeViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
