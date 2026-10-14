package com.pizzastore.android_app.utils

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pizzastore.android_app.network.CartItemCreateRequest
import com.pizzastore.android_app.network.CartItemResponse
import com.pizzastore.android_app.network.CartItemUpdateRequest
import com.pizzastore.android_app.network.CartSummaryResponse
import com.pizzastore.android_app.network.Product

class GuestCartManager(context: Context) {
    // Khởi tạo SharedPreferences (Lưu trữ cục bộ dưới dạng Key-Value) để lưu giỏ hàng khi người dùng chưa đăng nhập
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_GUEST_CART, Context.MODE_PRIVATE)
    private val gson = Gson()

    fun getGuestCartItems(): List<CartItemResponse> {
        // Lấy dữ liệu giỏ hàng dưới dạng chuỗi JSON từ bộ nhớ máy
        val json = prefs.getString(KEY_CART_ITEMS, null)
        if (json.isNullOrEmpty()) {
            return emptyList()
        }
        val type = object : TypeToken<List<CartItemResponse>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveGuestCartItems(items: List<CartItemResponse>) {
        val json = gson.toJson(items)
        prefs.edit().putString(KEY_CART_ITEMS, json).apply()
    }

    fun getCartSummary(): CartSummaryResponse {
        val items = getGuestCartItems()
        val totalItems = items.sumOf { it.quantity }
        val subtotal = items.sumOf { it.total_price }
        return CartSummaryResponse(items = items, total_items = totalItems, subtotal = subtotal)
    }

    fun addItem(request: CartItemCreateRequest, product: Product?): CartItemResponse {
        val items = getGuestCartItems().toMutableList()

        // Chuẩn hóa chuỗi trước khi so sánh (Cắt khoảng trắng dư thừa, chuyển thành chữ thường)
        val targetSize = request.size_name?.trim()?.takeIf { it.isNotEmpty() }
        val targetNote = request.note?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }

        // Tìm kiếm xem món ăn này đã tồn tại trong giỏ chưa (Thuật toán đối chiếu Local y hệt trên Backend)
        val existingIndex = items.indexOfFirst { it ->
            val itSize = it.size_name?.trim()?.takeIf { it.isNotEmpty() }
            val itNote = it.note?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
            
            // Basic matching
            val isSameProduct = it.product_id == request.product_id
            val isSameSize = itSize == targetSize
            val isSameNote = itNote == targetNote
            
            // Mảng Topping phải được sắp xếp theo bảng chữ cái để so sánh chính xác nhất
            val itToppingsNames = it.toppings?.map { top -> top.topping_name.trim().lowercase() }?.sorted() ?: emptyList()
            val reqToppingsNames = request.toppings?.map { top -> top.topping_name.trim().lowercase() }?.sorted() ?: emptyList()
            val isSameToppings = itToppingsNames == reqToppingsNames

            isSameProduct && isSameSize && isSameNote && isSameToppings
        }

        if (existingIndex > -1) {
            // Nếu trùng khớp 100% -> Gộp số lượng và tính lại tiền
            val existing = items[existingIndex]
            val newQuantity = existing.quantity + request.quantity
            val newTotalPrice = existing.unit_price * newQuantity
            val updated = existing.copy(
                quantity = newQuantity,
                total_price = newTotalPrice
            )
            items[existingIndex] = updated
            saveGuestCartItems(items)
            return updated
        } else {
            // Nếu không trùng -> Tạo bản ghi JSON mới trong Local DB
            val newItemId = (items.maxOfOrNull { it.id } ?: 0) + 1
            val totalPrice = request.unit_price * request.quantity
            val newItem = CartItemResponse(
                id = newItemId,
                user_id = 0, // Guest user id
                product_id = request.product_id,
                size_name = request.size_name,
                toppings = request.toppings,
                quantity = request.quantity,
                note = request.note,
                unit_price = request.unit_price,
                total_price = totalPrice,
                product = product ?: Product(
                    id = request.product_id,
                    name = "Sản phẩm #${request.product_id}",
                    description = null,
                    price = request.unit_price,
                    image_url = null,
                    category_id = null,
                    is_available = true,
                    ingredients = emptyList(),
                    sizes = emptyList(),
                    toppings = emptyList(),
                    average_rating = 0.0,
                    total_reviews = 0
                )
            )
            items.add(newItem)
            saveGuestCartItems(items)
            return newItem
        }
    }

    fun updateItem(id: Int, request: CartItemUpdateRequest): CartItemResponse {
        val items = getGuestCartItems().toMutableList()
        val index = items.indexOfFirst { it.id == id }
        
        if (index > -1) {
            val existing = items[index]
            val newQuantity = request.quantity ?: existing.quantity
            val newSizeName = request.size_name ?: existing.size_name
            val newToppings = request.toppings ?: existing.toppings
            val newNote = request.note ?: existing.note
            val newUnitPrice = request.unit_price ?: existing.unit_price
            val newTotalPrice = newUnitPrice * newQuantity

            val updated = existing.copy(
                quantity = newQuantity,
                size_name = newSizeName,
                toppings = newToppings,
                note = newNote,
                unit_price = newUnitPrice,
                total_price = newTotalPrice
            )
            
            items[index] = updated
            
            // Kiểm tra xem có cần gộp với mục khác sau khi cập nhật hay không
            val matchIdx = items.indexOfFirst { it ->
                if (it.id == id) return@indexOfFirst false
                
                val itSize = it.size_name?.trim()?.takeIf { it.isNotEmpty() }
                val targetSize = updated.size_name?.trim()?.takeIf { it.isNotEmpty() }
                
                val itNote = it.note?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
                val targetNote = updated.note?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
                
                val itToppingsNames = it.toppings?.map { top -> top.topping_name.trim().lowercase() }?.sorted() ?: emptyList()
                val reqToppingsNames = updated.toppings?.map { top -> top.topping_name.trim().lowercase() }?.sorted() ?: emptyList()
                
                it.product_id == updated.product_id &&
                itSize == targetSize &&
                itNote == targetNote &&
                itToppingsNames == reqToppingsNames
            }
            
            if (matchIdx > -1) {
                val matched = items[matchIdx]
                val mergedQuantity = matched.quantity + updated.quantity
                val mergedTotalPrice = matched.unit_price * mergedQuantity
                items[matchIdx] = matched.copy(
                    quantity = mergedQuantity,
                    total_price = mergedTotalPrice
                )
                items.removeAt(index)
            }
            
            saveGuestCartItems(items)
            return updated
        }
        
        throw Exception("Item not found in guest cart")
    }

    fun deleteItem(id: Int) {
        val items = getGuestCartItems().toMutableList()
        items.removeAll { it.id == id }
        saveGuestCartItems(items)
    }

    fun clearCart() {
        prefs.edit().remove(KEY_CART_ITEMS).apply()
    }

    companion object {
        const val PREFS_GUEST_CART = "prefs_guest_cart"
        const val KEY_CART_ITEMS = "guest_cart_items"
    }
}
