package com.pizzastore.android_app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pizzastore.android_app.network.OrderResponse

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailBottomSheet(
    order: OrderResponse,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val statusMap = mapOf(
        "pending" to ("Chờ xác nhận" to Color(0xFFF59E0B)),
        "confirmed" to ("Đã xác nhận" to Color(0xFF3B82F6)),
        "shipping" to ("Đang giao" to Color(0xFF6366F1)),
        "completed" to ("Hoàn thành" to Color(0xFF10B981)),
        "cancelled" to ("Đã hủy" to Color(0xFFEF4444))
    )
    val statusInfo = statusMap[order.status] ?: (order.status to Color.Gray)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Chi tiết đơn hàng",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Đóng")
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                // Status Banner
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFF8F9FA), RoundedCornerShape(12.dp))
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Trạng thái hiện tại:", fontWeight = FontWeight.Bold, color = Color.DarkGray)
                        Surface(
                            color = statusInfo.second.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                text = statusInfo.first,
                                color = statusInfo.second,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }
                }

                // Shipping Info
                item {
                    Column {
                        Text(
                            text = "THÔNG TIN NHẬN HÀNG",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.Gray,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF8F9FA), RoundedCornerShape(12.dp))
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row {
                                Text("Người nhận: ", fontWeight = FontWeight.Bold, color = Color.Black)
                                Text(order.shipping_full_name, color = Color.DarkGray)
                            }
                            Row {
                                Text("Số điện thoại: ", fontWeight = FontWeight.Bold, color = Color.Black)
                                Text(order.shipping_phone, color = Color.DarkGray)
                            }
                            Row {
                                Text("Địa chỉ giao: ", fontWeight = FontWeight.Bold, color = Color.Black)
                                Text(order.shipping_address, color = Color.DarkGray)
                            }
                            if (!order.note.isNullOrEmpty()) {
                                Row {
                                    Text("Ghi chú: ", fontWeight = FontWeight.Bold, color = Color.Black)
                                    Text(order.note, color = Color.DarkGray)
                                }
                            }
                        }
                    }
                }

                // Items List
                item {
                    Text(
                        text = "DANH SÁCH MÓN ĂN (${order.items?.size ?: 0})",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.Gray,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                val items = order.items ?: emptyList()
                items(items) { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Product Image
                        if (!item.product?.image_url.isNullOrEmpty()) {
                            AsyncImage(
                                model = item.product?.image_url,
                                contentDescription = item.product?.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF0F0F0))
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF0F0F0)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Pizza", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                            }
                        }

                        // Product Details
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${item.product?.name ?: "Bánh Pizza"} ",
                                fontWeight = FontWeight.Bold,
                                color = Color.Black
                            )
                            Text(
                                text = "x${item.quantity}",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE53935),
                                fontSize = 14.sp
                            )
                            if (item.size_name != null) {
                                Text("Size: ${item.size_name}", color = Color.Gray, fontSize = 13.sp)
                            }
                            if (!item.toppings.isNullOrEmpty()) {
                                val toppingsStr = item.toppings.mapNotNull { 
                                    if (it.isJsonPrimitive && it.asJsonPrimitive.isString) it.asString
                                    else if (it.isJsonObject && it.asJsonObject.has("name")) it.asJsonObject.get("name").asString
                                    else null
                                }.joinToString(", ")
                                if (toppingsStr.isNotEmpty()) {
                                    Text("Topping: $toppingsStr", color = Color.Gray, fontSize = 13.sp)
                                }
                            }
                        }

                        // Price
                        Text(
                            text = "${String.format("%,.0f", item.unit_price * item.quantity)}đ",
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                    }
                    HorizontalDivider(color = Color(0xFFF0F0F0))
                }

                // Payment Summary
                item {
                    Column {
                        Text(
                            text = "CHI TIẾT THANH TOÁN",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.Gray,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF8F9FA), RoundedCornerShape(12.dp))
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            val subtotal = (order.total_amount) + (order.discount_amount ?: 0.0)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Tạm tính", color = Color.DarkGray)
                                Text("${String.format("%,.0f", subtotal)}đ", fontWeight = FontWeight.Bold)
                            }

                            if (order.discount_amount != null && order.discount_amount > 0) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        "Voucher giảm giá ${if (!order.voucher_code.isNullOrEmpty()) "(${order.voucher_code})" else ""}",
                                        color = Color(0xFF10B981)
                                    )
                                    Text("-${String.format("%,.0f", order.discount_amount)}đ", fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                }
                            }

                            HorizontalDivider(color = Color(0xFFE5E7EB))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Tổng thanh toán", fontWeight = FontWeight.Bold, color = Color.Black)
                                Text(
                                    "${String.format("%,.0f", order.total_amount)}đ",
                                    fontWeight = FontWeight.Black,
                                    fontSize = 18.sp,
                                    color = Color(0xFFE53935)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
