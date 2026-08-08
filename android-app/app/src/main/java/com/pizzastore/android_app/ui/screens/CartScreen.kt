package com.pizzastore.android_app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pizzastore.android_app.network.CartItemResponse
import com.pizzastore.android_app.viewmodel.CartState
import com.pizzastore.android_app.viewmodel.CartViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    viewModel: CartViewModel,
    onCheckoutClick: (String?) -> Unit,
    onBackClick: () -> Unit,
    onEditClick: (Int, Int) -> Unit
) {
    val state by viewModel.state.collectAsState()
    val voucherCode by viewModel.voucherCode.collectAsState()
    val discountAmount by viewModel.discountAmount.collectAsState()
    val voucherMessage by viewModel.voucherMessage.collectAsState()
    val vouchers by viewModel.vouchers.collectAsState()
    
    var showVoucherSheet by remember { mutableStateOf(false) }

    // Calculate totals safely
    var totalAmount = 0.0
    if (state is CartState.Success) {
        val currentState = state as CartState.Success
        val subtotal = currentState.subtotal
        val shippingFee = if (subtotal >= 200000.0) 0.0 else 25000.0
        totalAmount = subtotal - discountAmount + shippingFee
        if (totalAmount < 0) totalAmount = 0.0
    }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = { Text("Giỏ hàng", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        bottomBar = {
            if (state is CartState.Success && (state as CartState.Success).items.isNotEmpty()) {
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 16.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 16.dp)
                            .navigationBarsPadding(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Tổng thanh toán",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${String.format("%,.0f", totalAmount)}đ",
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        
                        Button(
                            onClick = { onCheckoutClick(voucherCode) },
                            modifier = Modifier
                                .weight(1.2f)
                                .height(56.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Text(
                                "Thanh toán", 
                                style = MaterialTheme.typography.titleMedium, 
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (val currentState = state) {
                is CartState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                is CartState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = "Có lỗi xảy ra", color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.loadCart() }) {
                            Text("Thử lại")
                        }
                    }
                }
                is CartState.Success -> {
                    if (currentState.items.isEmpty()) {
                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.ShoppingCart,
                                contentDescription = "Empty Cart",
                                modifier = Modifier.size(80.dp),
                                tint = MaterialTheme.colorScheme.outlineVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Giỏ hàng đang trống",
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp),
                            contentPadding = PaddingValues(bottom = 24.dp)
                        ) {
                            items(currentState.items) { item ->
                                CartItemCard(
                                    item = item,
                                    onIncrease = { viewModel.updateQuantity(item.id, item.quantity, 1) },
                                    onDecrease = { viewModel.updateQuantity(item.id, item.quantity, -1) },
                                    onDelete = { viewModel.removeItem(item.id) },
                                    onEdit = { onEditClick(item.id, item.product_id) }
                                )
                            }

                            item {
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                // Voucher Section (BottomSheet Ready)
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { showVoucherSheet = true },
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "🎫",
                                                fontSize = 20.sp
                                            )
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Text(
                                                text = if (discountAmount > 0) "Đã áp dụng mã giảm giá" else "Chọn hoặc nhập khuyến mãi",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Medium,
                                                color = if (discountAmount > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                            )
                                        }
                                        Icon(
                                            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                            contentDescription = "Chọn",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(24.dp))

                                // Order Summary Section
                                Text(
                                    text = "Chi tiết thanh toán",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(bottom = 16.dp)
                                )

                                val subtotal = currentState.subtotal
                                val shippingFee = if (subtotal >= 200000.0) 0.0 else 25000.0
                                val totalItemsCount = currentState.items.sumOf { it.quantity }

                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Tạm tính ($totalItemsCount món)", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("${String.format("%,.0f", subtotal)}đ", fontWeight = FontWeight.Medium)
                                    }
                                    
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Phí giao hàng", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(if (shippingFee == 0.0) "Miễn phí" else "${String.format("%,.0f", shippingFee)}đ", fontWeight = FontWeight.Medium)
                                    }
                                    
                                    if (discountAmount > 0) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Giảm giá", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text("-${String.format("%,.0f", discountAmount)}đ", fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.tertiary)
                                        }
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(32.dp))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showVoucherSheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showVoucherSheet = false },
            sheetState = sheetState,
            containerColor = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "Kho voucher của tôi",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Chọn một mã giảm giá để áp dụng cho đơn hàng của bạn",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                if (vouchers.isEmpty()) {
                    Text(
                        "Không có mã khuyến mãi nào khả dụng",
                        modifier = Modifier.padding(vertical = 32.dp).align(Alignment.CenterHorizontally),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    androidx.compose.foundation.lazy.LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(vouchers.size) { index ->
                            val userVoucher = vouchers[index]
                            val voucher = userVoucher.voucher_details
                            val isSelected = userVoucher.voucher_code == voucherCode
                            
                            val backgroundColor = if (isSelected) Color(0xFFFFF0F0) else Color.White
                            val borderColor = if (isSelected) Color(0xFFE53935) else Color(0xFFE0E0E0)
                            
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(IntrinsicSize.Min)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(backgroundColor)
                                    .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                                    .clickable {
                                        if (!isSelected) {
                                            viewModel.onVoucherCodeChange(userVoucher.voucher_code)
                                            viewModel.applyVoucher(userVoucher.voucher_code)
                                            showVoucherSheet = false
                                        }
                                    }
                            ) {
                                // Left Edge Ticket Style
                                Box(
                                    modifier = Modifier
                                        .width(10.dp)
                                        .fillMaxHeight()
                                        .background(if (isSelected) Color(0xFFE53935) else Color(0xFFEF5350))
                                ) {
                                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                                        val radius = 5.dp.toPx()
                                        drawCircle(Color.White, radius, androidx.compose.ui.geometry.Offset(0f, 0f))
                                        drawCircle(Color.White, radius, androidx.compose.ui.geometry.Offset(0f, size.height))
                                    }
                                }

                                // Separator
                                androidx.compose.foundation.Canvas(modifier = Modifier.width(1.dp).fillMaxHeight()) {
                                    val path = androidx.compose.ui.graphics.Path().apply {
                                        moveTo(0f, 0f)
                                        lineTo(0f, size.height)
                                    }
                                    drawPath(
                                        path = path,
                                        color = if (isSelected) Color(0xFFE53935) else Color(0xFFEF5350),
                                        style = androidx.compose.ui.graphics.drawscope.Stroke(
                                            width = 2f,
                                            pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                                        )
                                    )
                                }
                                
                                Row(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    color = if (isSelected) Color(0xFFFFCDD2) else Color(0xFFFFEBEE),
                                                    shape = RoundedCornerShape(4.dp)
                                                )
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = userVoucher.voucher_code.uppercase(),
                                                fontWeight = FontWeight.Black,
                                                color = Color(0xFFC62828),
                                                fontSize = 12.sp,
                                                letterSpacing = 1.sp
                                            )
                                        }
                                        
                                        Spacer(modifier = Modifier.height(6.dp))
                                        
                                        val desc = if (voucher?.discount_percent != null) {
                                            "Giảm ${voucher.discount_percent}%" + if (voucher.max_discount != null) " (Tối đa ${String.format("%,.0f", voucher.max_discount)}đ)" else ""
                                        } else if (voucher?.discount_amount != null) {
                                            "Giảm ${String.format("%,.0f", voucher.discount_amount)}đ"
                                        } else {
                                            "Mã khuyến mãi"
                                        }
                                        
                                        Text(
                                            text = desc,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.Black
                                        )
                                        
                                        Spacer(modifier = Modifier.height(4.dp))
                                        
                                        Text(
                                            text = "Đơn tối thiểu: ${String.format("%,.0f", voucher?.min_order_value ?: 0.0)}đ",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color.Gray
                                        )
                                    }
                                    
                                    Spacer(modifier = Modifier.width(8.dp))
                                    
                                    if (isSelected) {
                                        Surface(
                                            color = Color(0xFFE53935),
                                            shape = CircleShape
                                        ) {
                                            Icon(
                                                imageVector = androidx.compose.material.icons.Icons.Default.Check,
                                                contentDescription = "Selected",
                                                tint = Color.White,
                                                modifier = Modifier.padding(4.dp).size(20.dp)
                                            )
                                        }
                                    } else {
                                        Surface(
                                            shape = CircleShape,
                                            border = androidx.compose.foundation.BorderStroke(1.dp, Color.LightGray),
                                            color = Color.Transparent
                                        ) {
                                            Box(modifier = Modifier.size(28.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun CartItemCard(
    item: CartItemResponse,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
    onDelete: () -> Unit,
    onEdit: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.padding(16.dp)
            ) {
                // Product Image
                val imageUrl = if (item.product?.image_url.isNullOrEmpty()) null 
                    else if (item.product?.image_url!!.startsWith("http")) item.product.image_url 
                    else "http://10.0.2.2:8000/${item.product.image_url.removePrefix("/")}"

                AsyncImage(
                    model = imageUrl,
                    contentDescription = item.product?.name,
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop
                )
                
                Spacer(modifier = Modifier.width(16.dp))
                
                // Content
                Column(modifier = Modifier.weight(1f).padding(end = 24.dp)) {
                    Text(
                        text = item.product?.name ?: "Sản phẩm",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    if (!item.size_name.isNullOrEmpty()) {
                        Text(
                            text = "Size: ${item.size_name}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    item.toppings?.forEach { topping ->
                        Text(
                            text = "+ ${topping.topping_name}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (!item.note.isNullOrEmpty()) {
                        Text(
                            text = "Ghi chú: ${item.note}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    Text(
                        text = "Chỉnh sửa",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.clickable { onEdit() }
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Price & Quantity Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${String.format("%,.0f", item.unit_price)}đ",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.ExtraBold
                        )
                        
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                .padding(horizontal = 4.dp, vertical = 4.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = if (item.quantity > 1) MaterialTheme.colorScheme.surface else Color.Transparent,
                                modifier = Modifier.size(28.dp).clickable(enabled = item.quantity > 1) { onDecrease() },
                                shadowElevation = if (item.quantity > 1) 2.dp else 0.dp
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("-", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                }
                            }
                            Text(
                                text = "${item.quantity}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            )
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.surface,
                                modifier = Modifier.size(28.dp).clickable { onIncrease() },
                                shadowElevation = 2.dp
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("+", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                }
                            }
                        }
                    }
                }
            }
            
            // Delete Button (Top Right)
            IconButton(
                onClick = onDelete,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
