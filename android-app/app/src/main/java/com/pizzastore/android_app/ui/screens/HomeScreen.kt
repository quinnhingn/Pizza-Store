package com.pizzastore.android_app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Menu
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
import androidx.compose.ui.unit.sp
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.ui.components.CategoryItem
import com.pizzastore.android_app.ui.components.PriceFilterBottomSheet
import com.pizzastore.android_app.ui.components.ProductCard
import com.pizzastore.android_app.ui.components.SectionHeader
import com.pizzastore.android_app.viewmodel.HomeState
import com.pizzastore.android_app.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onProductClick: (Int) -> Unit,
    onCartClick: () -> Unit,
    onProfileClick: () -> Unit
) {
    val homeState by viewModel.homeState.collectAsState()
    val cartItemCount by viewModel.cartItemCount.collectAsState()
    var selectedCategory by remember { mutableStateOf("Tất cả") }
    var searchQuery by remember { mutableStateOf("") }
    
    // Filter State
    var showFilterSheet by remember { mutableStateOf(false) }
    var minPriceFilter by remember { mutableStateOf<Float?>(null) }
    var maxPriceFilter by remember { mutableStateOf<Float?>(null) }

    val categories = listOf(
        Pair("Tất cả", "🍽️"),
        Pair("Pizza", "🍕"),
        Pair("Đồ uống", "🧃"),
        Pair("Khai vị", "🍟")
    )

    if (showFilterSheet) {
        PriceFilterBottomSheet(
            currentMinPrice = minPriceFilter,
            currentMaxPrice = maxPriceFilter,
            onApplyFilter = { min, max ->
                minPriceFilter = min
                maxPriceFilter = max
            },
            onResetFilter = {
                minPriceFilter = null
                maxPriceFilter = null
            },
            onDismiss = { showFilterSheet = false }
        )
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .statusBarsPadding(),
            contentPadding = PaddingValues(bottom = 24.dp) // extra padding at the bottom of the list
        ) {
            item { Spacer(modifier = Modifier.height(16.dp)) }

            // 1. Top Header Row (Menu + Location + Cart)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Menu Icon (Left)
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        modifier = Modifier
                            .size(46.dp)
                            .clickable { onProfileClick() }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "Menu",
                                modifier = Modifier.size(24.dp),
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    // Location (Center)
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "Vị trí giao hàng",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(top = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Vị trí",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Nhà của bạn",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    }

                    // Cart Icon (Right)
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        modifier = Modifier
                            .size(46.dp)
                            .clickable { onCartClick() }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (cartItemCount > 0) {
                                BadgedBox(
                                    badge = {
                                        Badge(
                                            containerColor = MaterialTheme.colorScheme.error,
                                            contentColor = Color.White
                                        ) {
                                            Text(if (cartItemCount > 99) "99+" else cartItemCount.toString())
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ShoppingCart,
                                        contentDescription = "Giỏ hàng",
                                        modifier = Modifier.size(22.dp),
                                        tint = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            } else {
                                Icon(
                                    imageVector = Icons.Default.ShoppingCart,
                                    contentDescription = "Giỏ hàng",
                                    modifier = Modifier.size(22.dp),
                                    tint = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 2. Promo Banner
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                        .height(130.dp),
                    shape = RoundedCornerShape(24.dp),
                    color = Color(0xFF1E1E1E), // Dark background for banner
                    shadowElevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(
                            modifier = Modifier
                                .weight(1.5f)
                                .padding(start = 20.dp, top = 20.dp, bottom = 20.dp, end = 8.dp),
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "Pizza & Đồ Uống",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Miễn phí giao hàng, giảm 5% cho đơn hàng đầu tiên.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.LightGray,
                                fontSize = 11.sp,
                                maxLines = 2
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = Color.White,
                                modifier = Modifier.clickable { /* action */ }
                            ) {
                                Text(
                                    text = "Đặt ngay",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                                )
                            }
                        }
                        
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                        ) {
                            // Using a placeholder graphic color if image isn't available
                            Surface(
                                modifier = Modifier.fillMaxSize(),
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                 Box(contentAlignment = Alignment.Center) {
                                     Text("🍕", fontSize = 64.sp)
                                 }
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 3. Search Bar + Filter Button
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        modifier = Modifier.weight(1f)
                    ) {
                        TextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = {
                                Text(
                                    text = "Tìm kiếm...",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Search,
                                    contentDescription = "Search",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(20.dp)
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
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

                    // Filter Button
                    val isFilterActive = minPriceFilter != null || maxPriceFilter != null
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isFilterActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        modifier = Modifier
                            .size(52.dp)
                            .clickable { showFilterSheet = true }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "Bộ lọc giá",
                                tint = if (isFilterActive) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 4. Categories Section
            item {
                Text(
                    text = "Chọn theo danh mục",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(horizontal = 20.dp)
                )
            }

            item { Spacer(modifier = Modifier.height(12.dp)) }

            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(horizontal = 20.dp)
                ) {
                    items(categories.size) { index ->
                        val (label, emoji) = categories[index]
                        CategoryItem(
                            label = label,
                            emoji = emoji,
                            isSelected = label == selectedCategory,
                            onClick = { selectedCategory = label }
                        )
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }

            // 5. Featured Products Header
            item {
                SectionHeader(
                    title = "Sản phẩm nổi bật",
                    actionText = "Xem tất cả"
                )
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }

            // Product Grid equivalent using chunked lists
            when (val state = homeState) {
                is HomeState.Loading -> {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
                is HomeState.Error -> {
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(text = "Rất tiếc! Có lỗi xảy ra.", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.loadProducts() }) {
                                Text("Thử lại")
                            }
                        }
                    }
                }
                is HomeState.Success -> {
                    val filteredProducts = state.products.filter { product ->
                        val matchesSearch = searchQuery.isBlank() || product.name.contains(searchQuery, ignoreCase = true)
                        val matchesMinPrice = minPriceFilter == null || product.price >= minPriceFilter!!
                        val matchesMaxPrice = maxPriceFilter == null || product.price <= maxPriceFilter!!
                        val matchesCategory = selectedCategory == "Tất cả" || (
                            if (selectedCategory == "Pizza") product.name.contains("Pizza", ignoreCase = true)
                            else if (selectedCategory == "Đồ uống") product.name.contains("nước", ignoreCase = true) || product.name.contains("cola", ignoreCase = true)
                            else true // Generic fallback
                        )
                        matchesSearch && matchesMinPrice && matchesMaxPrice && matchesCategory
                    }

                    if (filteredProducts.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier.fillMaxWidth().height(200.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Không tìm thấy sản phẩm phù hợp",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        // Chunk products into rows of 2 for grid-like appearance
                        val chunkedProducts = filteredProducts.chunked(2)
                        items(chunkedProducts) { rowProducts ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                // First product in the row
                                ProductCard(
                                    product = rowProducts[0],
                                    onClick = { onProductClick(rowProducts[0].id) },
                                    modifier = Modifier.weight(1f)
                                )
                                
                                // Second product in the row (if exists)
                                if (rowProducts.size > 1) {
                                    ProductCard(
                                        product = rowProducts[1],
                                        onClick = { onProductClick(rowProducts[1].id) },
                                        modifier = Modifier.weight(1f)
                                    )
                                } else {
                                    // Empty box to keep grid alignment when there is only 1 item in the last row
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
