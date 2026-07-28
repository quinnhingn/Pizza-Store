package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.network.ProductSizeItem
import com.pizzastore.android_app.network.ProductToppingItem
import com.pizzastore.android_app.repository.ProductRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import com.pizzastore.android_app.network.CartItemCreateRequest
import com.pizzastore.android_app.repository.CartRepository

sealed class ProductDetailState {
    object Loading : ProductDetailState()
    data class Success(val product: Product) : ProductDetailState()
    data class Error(val message: String) : ProductDetailState()
}

class ProductDetailViewModel(
    private val repository: ProductRepository,
    private val cartRepository: CartRepository,
    private val productId: Int
) : ViewModel() {
    
    private val _state = MutableStateFlow<ProductDetailState>(ProductDetailState.Loading)
    val state: StateFlow<ProductDetailState> = _state

    private val _selectedSize = MutableStateFlow<ProductSizeItem?>(null)
    val selectedSize: StateFlow<ProductSizeItem?> = _selectedSize

    private val _selectedToppings = MutableStateFlow<Set<ProductToppingItem>>(emptySet())
    val selectedToppings: StateFlow<Set<ProductToppingItem>> = _selectedToppings

    private val _quantity = MutableStateFlow(1)
    val quantity: StateFlow<Int> = _quantity

    val totalPrice: StateFlow<Double> = combine(
        _state, _selectedSize, _selectedToppings, _quantity
    ) { state, size, toppings, qty ->
        if (state is ProductDetailState.Success) {
            val product = state.product
            val basePrice = product.price
            var currentPrice = basePrice
            
            if (size != null) {
                currentPrice = (basePrice * size.price_multiplier) + size.extra_price
            }
            
            var toppingsPrice = 0.0
            for (topping in toppings) {
                toppingsPrice += topping.extra_price
            }
            
            (currentPrice + toppingsPrice) * qty
        } else {
            0.0
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)
    
    private val _isAddingToCart = MutableStateFlow(false)
    val isAddingToCart: StateFlow<Boolean> = _isAddingToCart

    private val _addToCartResult = MutableStateFlow<Boolean?>(null)
    val addToCartResult: StateFlow<Boolean?> = _addToCartResult

    init {
        loadProduct()
    }
    
    fun loadProduct() {
        viewModelScope.launch {
            _state.value = ProductDetailState.Loading
            val result = repository.getProductById(productId)
            if (result.isSuccess) {
                val product = result.getOrNull()
                if (product != null) {
                    _state.value = ProductDetailState.Success(product)
                    // Auto-select the first size if available
                    if (product.sizes.isNotEmpty()) {
                        _selectedSize.value = product.sizes.first()
                    }
                } else {
                    _state.value = ProductDetailState.Error("Product not found")
                }
            } else {
                _state.value = ProductDetailState.Error(result.exceptionOrNull()?.message ?: "Failed to load product")
            }
        }
    }
    
    fun selectSize(size: ProductSizeItem) {
        _selectedSize.value = size
    }
    
    fun toggleTopping(topping: ProductToppingItem) {
        val currentToppings = _selectedToppings.value.toMutableSet()
        if (currentToppings.contains(topping)) {
            currentToppings.remove(topping)
        } else {
            currentToppings.add(topping)
        }
        _selectedToppings.value = currentToppings
    }
    
    fun increaseQuantity() {
        _quantity.value += 1
    }
    
    fun decreaseQuantity() {
        if (_quantity.value > 1) {
            _quantity.value -= 1
        }
    }
    
    fun addToCart() {
        val currentState = _state.value
        if (currentState !is ProductDetailState.Success) return
        
        viewModelScope.launch {
            _isAddingToCart.value = true
            
            val request = CartItemCreateRequest(
                product_id = productId,
                size_name = _selectedSize.value?.size_name,
                toppings = _selectedToppings.value.toList(),
                quantity = _quantity.value,
                note = null,
                unit_price = currentState.product.price // Base price, backend might recompute or expect this
            )
            
            val result = cartRepository.addItemToCart(request)
            _isAddingToCart.value = false
            
            if (result.isSuccess) {
                _addToCartResult.value = true
            } else {
                _addToCartResult.value = false
            }
        }
    }
    
    fun resetAddToCartResult() {
        _addToCartResult.value = null
    }
}

class ProductDetailViewModelFactory(
    private val repository: ProductRepository,
    private val cartRepository: CartRepository,
    private val productId: Int
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ProductDetailViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ProductDetailViewModel(repository, cartRepository, productId) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
