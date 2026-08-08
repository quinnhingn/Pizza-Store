package com.pizzastore.android_app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pizzastore.android_app.network.UserVoucherResponse
import com.pizzastore.android_app.viewmodel.VoucherWalletState
import com.pizzastore.android_app.viewmodel.VoucherWalletViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoucherWalletScreen(
    viewModel: VoucherWalletViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    var historySubTab by remember { mutableIntStateOf(0) } // 0: Used, 1: Expired

    LaunchedEffect(selectedTab) {
        if (selectedTab == 0) {
            viewModel.loadVouchers("active")
        } else {
            viewModel.loadVouchers("history")
        }
    }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = { Text("Kho Voucher", fontWeight = FontWeight.ExtraBold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = MaterialTheme.colorScheme.primary,
                indicator = { tabPositions ->
                    if (selectedTab < tabPositions.size) {
                        TabRowDefaults.Indicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = MaterialTheme.colorScheme.primary,
                            height = 3.dp
                        )
                    }
                }
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Sẵn sàng sử dụng", fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal) },
                    selectedContentColor = MaterialTheme.colorScheme.primary,
                    unselectedContentColor = Color.Gray
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Lịch sử", fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal) },
                    selectedContentColor = MaterialTheme.colorScheme.primary,
                    unselectedContentColor = Color.Gray
                )
            }

            if (selectedTab == 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = historySubTab == 0,
                        onClick = { historySubTab = 0 },
                        label = { Text("Đã sử dụng") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFE8F5E9),
                            selectedLabelColor = Color(0xFF2E7D32)
                        )
                    )
                    FilterChip(
                        selected = historySubTab == 1,
                        onClick = { historySubTab = 1 },
                        label = { Text("Hết hiệu lực") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFF5F5F5),
                            selectedLabelColor = Color.Gray
                        )
                    )
                }
            } else {
                Spacer(modifier = Modifier.height(16.dp))
            }

            Box(modifier = Modifier.fillMaxSize()) {
                when (val currentState = state) {
                    is VoucherWalletState.Loading -> {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    }
                    is VoucherWalletState.Error -> {
                        Text(
                            text = "Lỗi: ${currentState.message}",
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    is VoucherWalletState.Success -> {
                        val vouchersToDisplay = if (selectedTab == 0) {
                            currentState.vouchers
                        } else {
                            if (historySubTab == 0) {
                                currentState.vouchers.filter { it.is_used }
                            } else {
                                currentState.vouchers.filter { !it.is_used }
                            }
                        }

                        if (vouchersToDisplay.isEmpty()) {
                            Text(
                                text = if (selectedTab == 0) "Bạn chưa có voucher nào." else "Không có dữ liệu.",
                                color = Color.Gray,
                                modifier = Modifier.align(Alignment.Center)
                            )
                        } else {
                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 20.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp),
                                contentPadding = PaddingValues(bottom = 24.dp)
                            ) {
                                items(vouchersToDisplay) { voucher ->
                                    val isExpired = selectedTab == 1 && historySubTab == 1
                                    val isUsed = selectedTab == 1 && historySubTab == 0
                                    VoucherCard(
                                        voucher = voucher,
                                        isExpired = isExpired,
                                        isUsed = isUsed
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

@Composable
fun VoucherCard(voucher: UserVoucherResponse, isExpired: Boolean, isUsed: Boolean) {
    val details = voucher.voucher_details
    val discountText = buildString {
        if (details?.discount_percent != null) {
            append("Giảm ${details.discount_percent}%")
        } else if (details?.discount_amount != null) {
            append("Giảm ${String.format("%,.0f", details.discount_amount)}đ")
        }
    }
    
    val conditionsText = buildString {
        if (details?.min_order_value != null) {
            append("Đơn tối thiểu ${String.format("%,.0f", details.min_order_value)}đ")
        }
        if (details?.max_discount != null && details.discount_percent != null) {
            append(". Giảm tối đa ${String.format("%,.0f", details.max_discount)}đ")
        }
    }
    
    val endDateStr = details?.end_date?.take(10)?.split("-")?.reversed()?.joinToString("/") ?: "Vô thời hạn"
    val savedDateStr = voucher.saved_at?.take(10)?.split("-")?.reversed()?.joinToString("/") ?: ""

    val cardColor = when {
        isExpired -> Color(0xFFF9FAFB)
        isUsed -> Color(0xFFF0FDF4)
        else -> Color.White
    }
    val edgeColor = when {
        isExpired -> Color(0xFFD1D5DB)
        isUsed -> Color(0xFF34D399)
        else -> Color(0xFFEF4444)
    }
    val opacity = if (isExpired || isUsed) 0.6f else 1f

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min)
            .clip(RoundedCornerShape(16.dp))
            .background(cardColor)
            .border(
                1.dp,
                if (isExpired) Color(0xFFE5E7EB) else if (isUsed) Color(0xFFA7F3D0) else Color(0xFFFEE2E2),
                RoundedCornerShape(16.dp)
            )
    ) {
        // Left edge - Ticket stub look
        Box(
            modifier = Modifier
                .width(12.dp)
                .fillMaxHeight()
                .background(edgeColor)
        ) {
            // Cutouts simulation
            Canvas(modifier = Modifier.fillMaxSize()) {
                val cutoutRadius = 6.dp.toPx()
                drawCircle(
                    color = Color.White,
                    radius = cutoutRadius,
                    center = androidx.compose.ui.geometry.Offset(0f, 0f)
                )
                drawCircle(
                    color = Color.White,
                    radius = cutoutRadius,
                    center = androidx.compose.ui.geometry.Offset(0f, size.height)
                )
            }
        }

        // Dashed line divider
        Canvas(modifier = Modifier.width(1.dp).fillMaxHeight()) {
            val path = Path().apply {
                moveTo(0f, 0f)
                lineTo(0f, size.height)
            }
            drawPath(
                path = path,
                color = edgeColor,
                style = Stroke(
                    width = 2f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                )
            )
        }

        // Main content
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                // Code badge
                Box(
                    modifier = Modifier
                        .background(
                            color = if (isExpired) Color(0xFFF3F4F6) else if (isUsed) Color(0xFFD1FAE5) else Color(0xFFFEE2E2),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = voucher.voucher_code.uppercase(),
                        color = if (isExpired) Color(0xFF4B5563) else if (isUsed) Color(0xFF065F46) else Color(0xFF991B1B),
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                        letterSpacing = 1.sp
                    )
                }

                // Status Text
                if (isUsed) {
                    Text(text = "Đã dùng", color = Color(0xFF059669), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                } else if (isExpired) {
                    Text(text = "Hết hạn", color = Color(0xFF6B7280), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                } else {
                    Text(text = "HSD: $endDateStr", color = Color(0xFFEA580C), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = discountText,
                fontWeight = FontWeight.Black,
                fontSize = 18.sp,
                color = if (isExpired) Color.Gray else Color.Black
            )
            
            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = conditionsText,
                fontSize = 12.sp,
                color = Color.Gray,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            if (!isUsed && !isExpired && savedDateStr.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Divider(color = Color(0xFFF3F4F6), thickness = 1.dp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "ĐÃ LƯU NGÀY: $savedDateStr",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.LightGray,
                    letterSpacing = 0.5.sp
                )
            }
        }
    }
}
