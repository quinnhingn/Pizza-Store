package com.pizzastore.android_app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.network.BannerResponse
import com.pizzastore.android_app.network.CategoryResponse
import com.pizzastore.android_app.ui.components.CategoryItem
import com.pizzastore.android_app.ui.components.PriceFilterBottomSheet
import com.pizzastore.android_app.ui.components.ProductCard
import com.pizzastore.android_app.ui.components.ProductReviewsBottomSheet
import com.pizzastore.android_app.ui.components.SectionHeader
import com.pizzastore.android_app.ui.components.ShimmerBanner
import com.pizzastore.android_app.ui.components.ShimmerProductCard
import com.pizzastore.android_app.ui.components.shimmerEffect
import com.pizzastore.android_app.viewmodel.HomeState
import com.pizzastore.android_app.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onProductClick: (Int) -> Unit,
    onCartClick: () -> Unit,
    onMenuClick: () -> Unit,
    onProfileClick: () -> Unit,
    onChatbotClick: () -> Unit = {},
    onNotificationClick: () -> Unit = {}
) {
    val homeState by viewModel.homeState.collectAsState()
    val cartItemCount by viewModel.cartItemCount.collectAsState()
    val banners by viewModel.banners.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val selectedCategoryId by viewModel.selectedCategoryId.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    

    // Filter State
    var showFilterSheet by remember { mutableStateOf(false) }
    var minPriceFilter by remember { mutableStateOf<Float?>(null) }
    var maxPriceFilter by remember { mutableStateOf<Float?>(null) }
    var reviewProduct by remember { mutableStateOf<Product?>(null) }
    var isRefreshing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

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

    val reviews by viewModel.reviews.collectAsState()
    val isReviewsLoading by viewModel.isReviewsLoading.collectAsState()

    if (reviewProduct != null) {
        LaunchedEffect(reviewProduct) {
            viewModel.fetchReviews(reviewProduct!!.id)
        }
        ProductReviewsBottomSheet(
            product = reviewProduct!!,
            reviews = reviews,
            isLoading = isReviewsLoading,
            onDismissRequest = {
                reviewProduct = null
                viewModel.clearReviews()
            }
        )
    }

    Scaffold(
        containerColor = Color.White,
        floatingActionButton = {
            FloatingActionButton(
                onClick = onChatbotClick,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Face, contentDescription = "Trợ lý ảo AI")
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 0.dp
            ) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Trang chủ") },
                    label = { Text("Trang chủ") },
                    selected = true,
                    onClick = { /* Already on Home */ },
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
                    selected = false,
                    onClick = onMenuClick,
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
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = {
                isRefreshing = true
                viewModel.reloadAll()
                coroutineScope.launch {
                    delay(1000)
                    isRefreshing = false
                }
            },
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                item { Spacer(modifier = Modifier.height(16.dp)) }

            // 1. Top Header Row (Location + Logo + Cart)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Logo (Left)
                    Text(
                        text = "Pizza Store",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 22.sp,
                        modifier = Modifier.clickable {
                            isRefreshing = true
                            viewModel.reloadAll()
                            coroutineScope.launch {
                                delay(1000)
                                isRefreshing = false
                            }
                        }
                    )

                    // Actions (Right)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Notification Icon
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Thông báo",
                            modifier = Modifier
                                .size(24.dp)
                                .clickable { onNotificationClick() },
                            tint = Color.Gray
                        )

                        // Cart Icon
                        Box(
                            modifier = Modifier
                                .clickable { onCartClick() }
                        ) {
                            Icon(
                                imageVector = Icons.Default.ShoppingCart,
                                contentDescription = "Giỏ hàng",
                                modifier = Modifier.size(24.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            if (cartItemCount > 0) {
                                Surface(
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.error,
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .offset(x = 6.dp, y = (-6).dp)
                                ) {
                                    Text(
                                        text = if (cartItemCount > 99) "99+" else cartItemCount.toString(),
                                        color = Color.White,
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }

            // 2. Promo Banner Pager
            item {
                if (banners.isNotEmpty()) {
                    val pagerState = rememberPagerState(pageCount = { banners.size })
                    
                    LaunchedEffect(pagerState) {
                        while(true) {
                            delay(4000L)
                            if (banners.isNotEmpty()) {
                                val nextPage = (pagerState.currentPage + 1) % banners.size
                                pagerState.animateScrollToPage(nextPage)
                            }
                        }
                    }

                    Column {
                        HorizontalPager(
                            state = pagerState,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(210.dp),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            pageSpacing = 12.dp
                        ) { page ->
                            val banner = banners[page]
                            val imageUrl = if (banner.image_url.startsWith("http")) banner.image_url
                            else "http://10.0.2.2:8000/${banner.image_url.removePrefix("/")}"

                            Surface(
                                modifier = Modifier.fillMaxSize(),
                                shape = RoundedCornerShape(16.dp),
                                color = Color(0xFF1E1E1E), // Fallback
                                shadowElevation = 0.dp
                            ) {
                                Box(modifier = Modifier.fillMaxSize()) {
                                    coil.compose.AsyncImage(
                                        model = imageUrl,
                                        contentDescription = banner.title,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                    )
                                    
                                    // Gradient Overlay
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(
                                                androidx.compose.ui.graphics.Brush.verticalGradient(
                                                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f)),
                                                    startY = 100f
                                                )
                                            )
                                    )
                                    
                                    // Text Content
                                    Column(
                                        modifier = Modifier
                                            .align(Alignment.BottomStart)
                                            .padding(16.dp)
                                    ) {
                                        if (!banner.title.isNullOrEmpty()) {
                                            Text(
                                                text = banner.title,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                        if (!banner.description.isNullOrEmpty()) {
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = banner.description,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = Color.White.copy(alpha = 0.9f),
                                                maxLines = 2,
                                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Page Indicators
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            repeat(banners.size) { iteration ->
                                val color = if (pagerState.currentPage == iteration) MaterialTheme.colorScheme.primary else Color.LightGray
                                val width = if (pagerState.currentPage == iteration) 24.dp else 8.dp
                                Box(
                                    modifier = Modifier
                                        .padding(horizontal = 4.dp)
                                        .height(6.dp)
                                        .width(width)
                                        .clip(RoundedCornerShape(3.dp))
                                        .background(color)
                                )
                            }
                        }
                    }
                } else if (homeState is HomeState.Loading) {
                    ShimmerBanner()
                } else {
                    // Fallback static banner
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .height(140.dp),
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
                                    color = Color.White
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
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }

            item { Spacer(modifier = Modifier.height(8.dp)) }


            // Search Bar + Filter Button
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
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

                    // Filter Button
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color.White,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEEEEEE)),
                        modifier = Modifier
                            .size(50.dp)
                            .clickable { showFilterSheet = true }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Menu, // placeholder for filter sliders
                                contentDescription = "Bộ lọc",
                                tint = Color.Black,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
            
            // Sections per Category
            when (val state = homeState) {
                is HomeState.Loading -> {
                    items(3) {
                        Spacer(modifier = Modifier.height(24.dp))
                        Box(modifier = Modifier.fillMaxWidth().height(24.dp).padding(horizontal = 16.dp).clip(RoundedCornerShape(4.dp)).shimmerEffect())
                        Spacer(modifier = Modifier.height(16.dp))
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = PaddingValues(horizontal = 16.dp)
                        ) {
                            items(3) {
                                ShimmerProductCard()
                            }
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
                    val baseFilteredProducts = state.products.filter { product ->
                        val matchesSearch = searchQuery.isBlank() || product.name.contains(searchQuery, ignoreCase = true)
                        val matchesMinPrice = minPriceFilter == null || product.price >= minPriceFilter!!
                        val matchesMaxPrice = maxPriceFilter == null || product.price <= maxPriceFilter!!
                        matchesSearch && matchesMinPrice && matchesMaxPrice
                    }

                    if (baseFilteredProducts.isEmpty()) {
                        item { Spacer(modifier = Modifier.height(24.dp)) }
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
                        // Display all categories
                        categories.forEach { category ->
                            val categoryProducts = baseFilteredProducts.filter { it.category_id == category.id }
                            
                            if (categoryProducts.isNotEmpty()) {
                                item { Spacer(modifier = Modifier.height(24.dp)) }
                                
                                item {
                                    SectionHeader(
                                        title = category.name,
                                        actionText = "Xem thêm",
                                        onActionClick = {
                                            viewModel.selectCategory(category.id)
                                            onMenuClick()
                                        }
                                    )
                                }
                                
                                item { Spacer(modifier = Modifier.height(16.dp)) }
                                
                                item {
                                    LazyRow(
                                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                                        contentPadding = PaddingValues(horizontal = 20.dp)
                                    ) {
                                        items(categoryProducts.take(4)) { product ->
                                            ProductCard(
                                                product = product,
                                                onClick = { onProductClick(product.id) },
                                                onReviewClick = { reviewProduct = product }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            }
        }
    }
}
