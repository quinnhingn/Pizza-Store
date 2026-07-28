package com.pizzastore.android_app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
    onCheckoutClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val voucherCode by viewModel.voucherCode.collectAsState()
    val discountAmount by viewModel.discountAmount.collectAsState()
    val voucherMessage by viewModel.voucherMessage.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Giỏ hàng của bạn", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (val currentState = state) {
                is CartState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
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
                                tint = Color.LightGray
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Giỏ hàng đang trống",
                                style = MaterialTheme.typography.titleLarge,
                                color = Color.Gray
                            )
                        }
                    } else {
                        Column(modifier = Modifier.fillMaxSize()) {
                            LazyColumn(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = 16.dp)
                            ) {
                                items(currentState.items) { item ->
                                    CartItemCard(
                                        item = item,
                                        onIncrease = { viewModel.updateQuantity(item.id, item.quantity, 1) },
                                        onDecrease = { viewModel.updateQuantity(item.id, item.quantity, -1) },
                                        onDelete = { viewModel.removeItem(item.id) }
                                    )
                                }
                            }

                            // Summary Section
                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shadowElevation = 16.dp,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    // Voucher Input
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        OutlinedTextField(
                                            value = voucherCode,
                                            onValueChange = { viewModel.onVoucherCodeChange(it) },
                                            label = { Text("Mã giảm giá") },
                                            modifier = Modifier.weight(1f),
                                            singleLine = true,
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Button(
                                            onClick = { viewModel.applyVoucher(voucherCode) },
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.height(56.dp)
                                        ) {
                                            Text("Áp dụng")
                                        }
                                    }
                                    if (!voucherMessage.isNullOrEmpty()) {
                                        Text(
                                            text = voucherMessage!!,
                                            color = if (discountAmount > 0) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error,
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(16.dp))

                                    // Pricing Breakdown
                                    val subtotal = currentState.subtotal
                                    val shippingFee = if (subtotal >= 200000.0) 0.0 else 25000.0
                                    var total = subtotal - discountAmount + shippingFee
                                    if (total < 0) total = 0.0

                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Tạm tính", color = Color.Gray)
                                        Text("${String.format("%,.0f", subtotal)} ₫", fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Phí giao hàng", color = Color.Gray)
                                        Text("${String.format("%,.0f", shippingFee)} ₫", fontWeight = FontWeight.Bold)
                                    }
                                    if (discountAmount > 0) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Giảm giá", color = Color.Gray)
                                            Text("-${String.format("%,.0f", discountAmount)} ₫", fontWeight = FontWeight.Bold, color = Color(0xFF4CAF50))
                                        }
                                    }
                                    
                                    Divider(modifier = Modifier.padding(vertical = 12.dp))
                                    
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                        Text("Tổng cộng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                        Text("${String.format("%,.0f", total)} ₫", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                    }
                                    
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    Button(
                                        onClick = onCheckoutClick,
                                        modifier = Modifier.fillMaxWidth().height(50.dp),
                                        shape = RoundedCornerShape(25.dp)
                                    ) {
                                        Text("Tiến hành thanh toán", style = MaterialTheme.typography.titleMedium)
                                    }
                                    Spacer(modifier = Modifier.height(16.dp))
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
fun CartItemCard(
    item: CartItemResponse,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
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
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.product?.name ?: "Sản phẩm ẩn",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                var details = ""
                if (!item.size_name.isNullOrEmpty()) details += "Size ${item.size_name}"
                if (!item.toppings.isNullOrEmpty()) {
                    if (details.isNotEmpty()) details += ", "
                    details += item.toppings.joinToString { it.topping_name }
                }
                
                if (details.isNotEmpty()) {
                    Text(
                        text = details,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                        maxLines = 2
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "${String.format("%,.0f", item.unit_price)} ₫",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.background)
                    ) {
                        TextButton(onClick = onDecrease, modifier = Modifier.size(32.dp), contentPadding = PaddingValues(0.dp)) {
                            Text("-", fontSize = 16.sp)
                        }
                        Text("${item.quantity}", modifier = Modifier.padding(horizontal = 4.dp))
                        TextButton(onClick = onIncrease, modifier = Modifier.size(32.dp), contentPadding = PaddingValues(0.dp)) {
                            Text("+", fontSize = 16.sp)
                        }
                    }
                }
            }
            
            IconButton(onClick = onDelete, modifier = Modifier.align(Alignment.Top)) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}
