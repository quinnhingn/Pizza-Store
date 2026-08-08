package com.pizzastore.android_app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pizzastore.android_app.ui.components.ProductCard
import com.pizzastore.android_app.ui.components.ProductReviewsBottomSheet
import com.pizzastore.android_app.ui.components.ShimmerProductCard
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.viewmodel.HomeState
import com.pizzastore.android_app.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuScreen(
    viewModel: HomeViewModel,
    onProductClick: (Int) -> Unit,
    onCartClick: () -> Unit,
    onHomeClick: () -> Unit,
    onProfileClick: () -> Unit
) {
    val homeState by viewModel.homeState.collectAsState()
    val cartItemCount by viewModel.cartItemCount.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val selectedCategoryId by viewModel.selectedCategoryId.collectAsState()
    
    var searchQuery by remember { mutableStateOf("") }
    var reviewProduct by remember { mutableStateOf<Product?>(null) }

    if (reviewProduct != null) {
        ProductReviewsBottomSheet(
            product = reviewProduct!!,
            onDismissRequest = { reviewProduct = null }
        )
    }

    Scaffold(
        containerColor = Color.White,
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 0.dp
            ) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Trang chủ") },
                    label = { Text("Trang chủ") },
                    selected = false,
                    onClick = onHomeClick,
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.primary,
                        selectedTextColor = MaterialTheme.colorScheme.primary,
                        indicatorColor = Color.Transparent,
                        unselectedIconColor = Color.Black,
                        unselectedTextColor = Color.Black
                    )
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.List, contentDescription = "Menu") },
                    label = { Text("Menu") },
                    selected = true,
                    onClick = { /* Already here */ },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.primary,
                        selectedTextColor = MaterialTheme.colorScheme.primary,
                        indicatorColor = Color.Transparent,
                        unselectedIconColor = Color.Black,
                        unselectedTextColor = Color.Black
                    )
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = "Tài khoản") },
                    label = { Text("Tài khoản") },
                    selected = false,
                    onClick = onProfileClick,
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MaterialTheme.colorScheme.primary,
                        selectedTextColor = MaterialTheme.colorScheme.primary,
                        indicatorColor = Color.Transparent,
                        unselectedIconColor = Color.Black,
                        unselectedTextColor = Color.Black
                    )
                )
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Top Bar: Search and Cart
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEEEEEE)),
                    modifier = Modifier.weight(1f)
                ) {
                    TextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = {
                            Text(
                                text = "Tìm món ngon...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.Gray
                            )
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search",
                                tint = Color.Gray,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        singleLine = true,
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            disabledIndicatorColor = Color.Transparent
                        )
                    )
                }

                // Cart Icon
                Box(
                    modifier = Modifier
                        .size(50.dp)
                        .clickable { onCartClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ShoppingCart,
                        contentDescription = "Giỏ hàng",
                        modifier = Modifier.size(28.dp),
                        tint = Color.Black
                    )
                    if (cartItemCount > 0) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier
                                .size(10.dp)
                                .align(Alignment.TopEnd)
                                .offset(x = (-4).dp, y = 6.dp)
                        ) {}
                    }
                }
            }

            // Categories Filter
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    CategoryChip(
                        text = "Tất cả",
                        isSelected = selectedCategoryId == null,
                        onClick = { viewModel.selectCategory(null) }
                    )
                }
                items(categories) { category ->
                    CategoryChip(
                        text = category.name,
                        isSelected = selectedCategoryId == category.id,
                        onClick = { viewModel.selectCategory(category.id) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Product List
            when (val state = homeState) {
                is HomeState.Loading -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(5) {
                            // Because ShimmerProductCard is hardcoded 300dp width in original file,
                            // we'll just wrap it in a box to center it or use as is. 
                            // It will show left-aligned which is fine for shimmer.
                            Box(modifier = Modifier.fillMaxWidth()) {
                                ShimmerProductCard()
                            }
                        }
                    }
                }
                is HomeState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "Rất tiếc! Có lỗi xảy ra.", style = MaterialTheme.typography.titleMedium)
                    }
                }
                is HomeState.Success -> {
                    val filteredProducts = state.products.filter { product ->
                        val matchesSearch = searchQuery.isBlank() || product.name.contains(searchQuery, ignoreCase = true)
                        val matchesCategory = selectedCategoryId == null || product.category_id == selectedCategoryId
                        matchesSearch && matchesCategory
                    }

                    if (filteredProducts.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(
                                text = "Không tìm thấy sản phẩm phù hợp",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filteredProducts) { product ->
                                ProductCard(
                                    product = product,
                                    onClick = { onProductClick(product.id) },
                                    onReviewClick = { reviewProduct = product },
                                    isFullWidth = true
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryChip(
    text: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(50),
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color(0xFFF5F5F5),
        border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else null,
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else Color.DarkGray,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp)
        )
    }
}
