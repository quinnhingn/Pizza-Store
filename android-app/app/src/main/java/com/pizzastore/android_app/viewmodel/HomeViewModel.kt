package com.pizzastore.android_app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.network.BannerResponse
import com.pizzastore.android_app.network.CategoryResponse
import com.pizzastore.android_app.repository.ProductRepository
import com.pizzastore.android_app.repository.CartRepository
import com.pizzastore.android_app.repository.BannerRepository
import com.pizzastore.android_app.repository.CategoryRepository
import com.pizzastore.android_app.repository.ReviewRepository
import com.pizzastore.android_app.network.PublicReviewItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class HomeState {
    object Loading : HomeState()
    data class Success(val products: List<Product>) : HomeState()
    data class Error(val message: String) : HomeState()
}

class HomeViewModel(
    private val repository: ProductRepository,
    private val cartRepository: CartRepository,
    private val bannerRepository: BannerRepository,
    private val categoryRepository: CategoryRepository,
    private val reviewRepository: ReviewRepository
) : ViewModel() {
    private val _homeState = MutableStateFlow<HomeState>(HomeState.Loading)
    val homeState: StateFlow<HomeState> = _homeState
    
    private val _banners = MutableStateFlow<List<BannerResponse>>(emptyList())
    val banners: StateFlow<List<BannerResponse>> = _banners

    private val _categories = MutableStateFlow<List<CategoryResponse>>(emptyList())
    val categories: StateFlow<List<CategoryResponse>> = _categories

    private val _selectedCategoryId = MutableStateFlow<Int?>(null)
    val selectedCategoryId: StateFlow<Int?> = _selectedCategoryId
    
    private val _isFiltering = MutableStateFlow(false)
    val isFiltering: StateFlow<Boolean> = _isFiltering
    
    val cartItemCount: StateFlow<Int> = cartRepository.cartItemCount
    
    private val _reviews = MutableStateFlow<List<PublicReviewItem>>(emptyList())
    val reviews: StateFlow<List<PublicReviewItem>> = _reviews
    
    private val _isReviewsLoading = MutableStateFlow(false)
    val isReviewsLoading: StateFlow<Boolean> = _isReviewsLoading

    init {
        loadBanners()
        loadCategories()
        loadProducts()
    }
    
    private fun loadBanners() {
        viewModelScope.launch {
            val result = bannerRepository.getActiveBanners()
            if (result.isSuccess) {
                _banners.value = result.getOrNull() ?: emptyList()
            }
        }
    }
    
    private fun loadCategories() {
        viewModelScope.launch {
            val result = categoryRepository.getCategories()
            if (result.isSuccess) {
                _categories.value = result.getOrNull() ?: emptyList()
            }
        }
    }

    fun selectCategory(categoryId: Int?) {
        viewModelScope.launch {
            _isFiltering.value = true
            _selectedCategoryId.value = categoryId
            kotlinx.coroutines.delay(300) // Simulate a slight loading animation for filtering
            _isFiltering.value = false
        }
    }
    
    fun reloadAll() {
        loadBanners()
        loadCategories()
        loadProducts()
    }
    
    fun loadProducts() {
        viewModelScope.launch {
            _homeState.value = HomeState.Loading
            val result = repository.getProducts(1, null, 100)
            if (result.isSuccess) {
                _homeState.value = HomeState.Success(result.getOrNull()?.items ?: emptyList())
            } else {
                _homeState.value = HomeState.Error(result.exceptionOrNull()?.message ?: "Failed to load products")
            }
        }
    }
    
    fun fetchReviews(productId: Int) {
        viewModelScope.launch {
            _isReviewsLoading.value = true
            val result = reviewRepository.getProductReviews(productId, 1, 20)
            _isReviewsLoading.value = false
            if (result.isSuccess) {
                _reviews.value = result.getOrNull()?.items ?: emptyList()
            } else {
                _reviews.value = emptyList()
            }
        }
    }
    
    fun clearReviews() {
        _reviews.value = emptyList()
    }
}

class HomeViewModelFactory(
    private val repository: ProductRepository,
    private val cartRepository: CartRepository,
    private val bannerRepository: BannerRepository,
    private val categoryRepository: CategoryRepository,
    private val reviewRepository: ReviewRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(HomeViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return HomeViewModel(repository, cartRepository, bannerRepository, categoryRepository, reviewRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
