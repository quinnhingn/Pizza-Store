package com.pizzastore.android_app.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pizzastore.android_app.network.ReviewSubmitItem
import com.pizzastore.android_app.network.ReviewSubmitRequest
import com.pizzastore.android_app.repository.ReviewRepository
import com.pizzastore.android_app.network.ReviewStatusItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

data class ReviewInputState(
    val rating: Int = 5,
    val comment: String = "",
    val imageUrl: String? = null,
    val isUploading: Boolean = false
)

class ReviewOrderViewModel(
    private val reviewRepository: ReviewRepository
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // Mapping from product_id to ReviewInputState
    private val _reviewsInput = MutableStateFlow<Map<Int, ReviewInputState>>(emptyMap())
    val reviewsInput: StateFlow<Map<Int, ReviewInputState>> = _reviewsInput.asStateFlow()

    private val _reviewStatuses = MutableStateFlow<List<ReviewStatusItem>>(emptyList())
    val reviewStatuses: StateFlow<List<ReviewStatusItem>> = _reviewStatuses.asStateFlow()

    fun fetchReviewStatus(orderId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = reviewRepository.getOrderReviewStatus(orderId)
            _isLoading.value = false
            if (result.isSuccess) {
                val statuses = result.getOrNull()?.items ?: emptyList()
                _reviewStatuses.value = statuses
                
                // Initialize for unreviewed items
                val unreviewedProductIds = statuses.filter { !it.is_reviewed }.map { it.product_id }
                initForUnreviewedProducts(unreviewedProductIds)
            } else {
                _error.value = "Lỗi khi tải dữ liệu đánh giá"
            }
        }
    }

    fun initForUnreviewedProducts(productIds: List<Int>) {
        val currentInputs = _reviewsInput.value.toMutableMap()
        productIds.forEach { productId ->
            if (!currentInputs.containsKey(productId)) {
                currentInputs[productId] = ReviewInputState()
            }
        }
        _reviewsInput.value = currentInputs
    }

    fun updateRating(productId: Int, rating: Int) {
        _reviewsInput.update { currentMap ->
            val currentState = currentMap[productId] ?: ReviewInputState()
            currentMap + (productId to currentState.copy(rating = rating))
        }
    }

    fun updateComment(productId: Int, comment: String) {
        _reviewsInput.update { currentMap ->
            val currentState = currentMap[productId] ?: ReviewInputState()
            currentMap + (productId to currentState.copy(comment = comment))
        }
    }

    fun removeImage(productId: Int) {
        _reviewsInput.update { currentMap ->
            val currentState = currentMap[productId] ?: ReviewInputState()
            currentMap + (productId to currentState.copy(imageUrl = null))
        }
    }

    fun uploadImage(productId: Int, file: File) {
        viewModelScope.launch {
            _reviewsInput.update { currentMap ->
                val currentState = currentMap[productId] ?: ReviewInputState()
                currentMap + (productId to currentState.copy(isUploading = true))
            }
            
            val result = reviewRepository.uploadReviewImage(file)
            
            _reviewsInput.update { currentMap ->
                val currentState = currentMap[productId] ?: ReviewInputState()
                if (result.isSuccess) {
                    currentMap + (productId to currentState.copy(isUploading = false, imageUrl = result.getOrNull()?.data?.url))
                } else {
                    currentMap + (productId to currentState.copy(isUploading = false))
                }
            }
            
            if (result.isFailure) {
                _error.value = "Lỗi khi tải ảnh lên"
            }
        }
    }

    fun submitReviews(orderId: Int) {
        val inputs = _reviewsInput.value
        val items = inputs.map { (productId, state) ->
            ReviewSubmitItem(
                product_id = productId,
                rating = state.rating,
                comment = state.comment.takeIf { it.isNotBlank() },
                image_url = state.imageUrl
            )
        }
        
        if (items.isEmpty()) {
            _error.value = "Không có đánh giá nào để gửi"
            return
        }
        
        viewModelScope.launch {
            _isSubmitting.value = true
            _error.value = null
            
            val result = reviewRepository.submitOrderReviews(orderId, ReviewSubmitRequest(items))
            
            _isSubmitting.value = false
            if (result.isSuccess) {
                _successMessage.value = "Cảm ơn bạn đã đánh giá!"
            } else {
                _error.value = result.exceptionOrNull()?.message ?: "Lỗi khi gửi đánh giá"
            }
        }
    }
    
    fun clearError() {
        _error.value = null
    }
    
    fun clearSuccessMessage() {
        _successMessage.value = null
    }
}

class ReviewOrderViewModelFactory(
    private val reviewRepository: ReviewRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ReviewOrderViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ReviewOrderViewModel(reviewRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
