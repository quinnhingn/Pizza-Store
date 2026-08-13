package com.pizzastore.android_app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import com.pizzastore.android_app.network.OrderResponse
import com.pizzastore.android_app.ui.components.OrderDetailBottomSheet
import com.pizzastore.android_app.viewmodel.OrderHistoryState
import com.pizzastore.android_app.viewmodel.OrderHistoryViewModel

val TRACKING_TABS = listOf(
    "all" to "Tất cả",
    "pending" to "Chờ xác nhận",
    "confirmed" to "Đã xác nhận",
    "shipping" to "Đang giao hàng"
)

val HISTORY_TABS = listOf(
    "all" to "Tất cả",
    "completed" to "Đã hoàn thành",
    "cancelled" to "Đã hủy"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderHistoryScreen(
    viewModel: OrderHistoryViewModel,
    screenType: String,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val activeTab by viewModel.activeTab.collectAsState()
    val notification by viewModel.notification.collectAsState()

    val currentTabs = if (screenType == "tracking") TRACKING_TABS else HISTORY_TABS
    val title = if (screenType == "tracking") "Theo dõi đơn hàng" else "Lịch sử mua hàng"
    var orderToView by remember { mutableStateOf<OrderResponse?>(null) }

    // Handle auto-hide notification
    LaunchedEffect(notification) {
        if (notification != null) {
            delay(3000)
            viewModel.clearNotification()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF9FAFB))) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                Column {
                    TopAppBar(
                        title = { Text(title, fontWeight = FontWeight.Black) },
                        navigationIcon = {
                            IconButton(onClick = onBackClick) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                    )
                    
                    ScrollableTabRow(
                        selectedTabIndex = currentTabs.indexOfFirst { it.first == activeTab }.takeIf { it >= 0 } ?: 0,
                        containerColor = Color.White,
                        contentColor = Color(0xFFE53935),
                        edgePadding = 8.dp,
                        divider = {}
                    ) {
                        currentTabs.forEachIndexed { index, (id, label) ->
                            val selected = activeTab == id
                            Tab(
                                selected = selected,
                                onClick = { viewModel.setTab(id) },
                                text = { 
                                    Text(
                                        text = label, 
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (selected) Color(0xFFE53935) else Color.Gray
                                    ) 
                                }
                            )
                        }
                    }
                }
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp)
            ) {
                when (val currentState = state) {
                    is OrderHistoryState.Loading -> {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = Color(0xFFE53935))
                            }
                        }
                    }
                    is OrderHistoryState.Error -> {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                Text("Lỗi: ${currentState.message}", color = Color.Red, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    is OrderHistoryState.Success -> {
                        if (currentState.orders.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().padding(64.dp), contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("🍕", fontSize = 48.sp)
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text("Chưa có đơn hàng nào", color = Color.Gray, fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        } else {
                            items(currentState.orders.size) { index ->
                                val order = currentState.orders[index]
                                OrderCardDetailed(
                                    order = order,
                                    onCancel = { viewModel.cancelOrder(order.id) },
                                    onConfirmReceived = { viewModel.confirmOrderReceived(order.id) },
                                    onViewDetails = { orderToView = order }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Sliding System Notification
        AnimatedVisibility(
            visible = notification != null,
            enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 16.dp, start = 16.dp, end = 16.dp).systemBarsPadding()
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF323232),
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, contentDescription = "Info", tint = Color.White)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(notification ?: "", color = Color.White, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                }
            }
        }
    }

    if (orderToView != null) {
        OrderDetailBottomSheet(
            order = orderToView!!,
            onDismiss = { orderToView = null }
        )
    }
}

fun isOrderReviewable(order: OrderResponse): Boolean {
    if (order.has_reviews) return true

    if (order.status != "completed" && !(order.status == "shipping" && order.customer_confirmed)) {
        return false
    }

    return try {
        val dateStr = order.updated_at ?: order.created_at
        val cleanDateStr = dateStr.take(19)
        val formatClean = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
        val orderDate = formatClean.parse(cleanDateStr)
        
        if (orderDate != null) {
            val diff = java.util.Date().time - orderDate.time
            val diffDays = diff / (1000 * 60 * 60 * 24)
            diffDays <= 7
        } else {
            false
        }
    } catch (e: Exception) {
        false
    }
}

@Composable
fun OrderCardDetailed(
    order: OrderResponse,
    onCancel: () -> Unit,
    onConfirmReceived: () -> Unit,
    onViewDetails: () -> Unit
) {
    val dateStr = order.created_at.take(10).split("-").reversed().joinToString("/")
    
    val statusMap = mapOf(
        "pending" to ("Chờ xác nhận" to Color(0xFFF59E0B)),
        "confirmed" to ("Đã xác nhận" to Color(0xFF3B82F6)),
        "shipping" to ("Đang giao hàng" to Color(0xFF6366F1)),
        "completed" to ("Hoàn thành" to Color(0xFF10B981)),
        "cancelled" to ("Đã hủy" to Color(0xFFEF4444))
    )
    
    val statusInfo = statusMap[order.status] ?: (order.status to Color.Gray)
    val statusLabel = statusInfo.first
    val statusColor = statusInfo.second

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFFF3F4F6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(order.order_code, fontWeight = FontWeight.Black, fontSize = 16.sp)
                    Text(" • $dateStr", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(start = 6.dp))
                }
                Surface(
                    color = statusColor.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        statusLabel,
                        color = statusColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF3F4F6))
            
            // Items Preview
            val itemsCount = order.items?.size ?: 0
            val displayItems = order.items?.take(2) ?: emptyList()
            
            if (displayItems.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    displayItems.forEach { item ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(
                                    "${item.product?.name ?: "Món ăn"} x${item.quantity}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                if (item.size_name != null) {
                                    Text("Size: ${item.size_name}", color = Color.Gray, fontSize = 12.sp)
                                }
                                if (!item.toppings.isNullOrEmpty()) {
                                    val toppingsStr = item.toppings.mapNotNull { 
                                        if (it.isJsonPrimitive && it.asJsonPrimitive.isString) {
                                            it.asString
                                        } else if (it.isJsonObject && it.asJsonObject.has("name")) {
                                            it.asJsonObject.get("name").asString
                                        } else null
                                    }.joinToString(", ")
                                    if (toppingsStr.isNotEmpty()) {
                                        Text("Topping: $toppingsStr", color = Color.Gray, fontSize = 12.sp)
                                    }
                                }
                            }
                            Text(
                                "${String.format("%,.0f", item.unit_price * item.quantity)}đ",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                    if (itemsCount > 2) {
                        Text("... và ${itemsCount - 2} món khác", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            } else {
                Text("Chi tiết các món ăn...", color = Color.Gray, fontSize = 14.sp)
            }
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF3F4F6))
            
            // Footer (Total & Actions)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Tổng thanh toán", color = Color.Gray, fontSize = 12.sp)
                    Text(
                        "${String.format("%,.0f", order.total_amount)}đ",
                        fontWeight = FontWeight.Black,
                        color = Color(0xFFE53935),
                        fontSize = 16.sp
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val spacingModifier = Modifier.padding(start = 8.dp)
                    if (order.status == "pending") {
                        OutlinedButton(
                            onClick = onCancel,
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, Color.Red),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.Red),
                            modifier = Modifier.height(36.dp)
                        ) {
                            Text("Hủy đơn", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else if (order.status == "shipping") {
                        if (order.customer_confirmed) {
                            Surface(
                                color = Color(0xFFE8F5E9),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(36.dp).then(spacingModifier)
                            ) {
                                Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(horizontal = 12.dp)) {
                                    Text("✓ Đã nhận hàng", color = Color(0xFF2E7D32), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        } else {
                            Button(
                                onClick = onConfirmReceived,
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                modifier = Modifier.height(36.dp).then(spacingModifier)
                            ) {
                                Text("Đã nhận hàng", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Button(
                        onClick = onViewDetails,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F2937)),
                        modifier = Modifier.height(36.dp).then(spacingModifier)
                    ) {
                        Text("Xem chi tiết", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    if (isOrderReviewable(order)) {
                        if (order.has_reviews) {
                            OutlinedButton(
                                onClick = { /* TODO: Review */ },
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, Color.LightGray),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.DarkGray, containerColor = Color.White),
                                modifier = Modifier.height(36.dp).then(spacingModifier)
                            ) {
                                Text("Xem lại / Đánh giá", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Button(
                                onClick = { /* TODO: Review */ },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
                                modifier = Modifier.height(36.dp).then(spacingModifier)
                            ) {
                                Text("Đánh giá", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
