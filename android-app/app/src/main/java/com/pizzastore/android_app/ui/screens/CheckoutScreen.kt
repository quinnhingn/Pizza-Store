package com.pizzastore.android_app.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pizzastore.android_app.network.UserAddressResponse
import com.pizzastore.android_app.viewmodel.CheckoutState
import com.pizzastore.android_app.viewmodel.CheckoutViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    viewModel: CheckoutViewModel,
    voucherCode: String?,
    onBackClick: () -> Unit,
    onCheckoutSuccess: () -> Unit
) {
    val status by viewModel.state.collectAsState()
    val addresses by viewModel.addresses.collectAsState()
    val selectedAddressId by viewModel.selectedAddressId.collectAsState()
    val useCustomAddress by viewModel.useCustomAddress.collectAsState()
    
    val fullName by viewModel.fullName.collectAsState()
    val phone by viewModel.phone.collectAsState()
    val addressLine by viewModel.addressLine.collectAsState()
    
    val paymentMethod by viewModel.paymentMethod.collectAsState()
    val note by viewModel.note.collectAsState()

    val context = LocalContext.current
    var showAddressSheet by remember { mutableStateOf(false) }

    LaunchedEffect(status) {
        if (status is CheckoutState.Error) {
            Toast.makeText(context, (status as CheckoutState.Error).message, Toast.LENGTH_SHORT).show()
            viewModel.resetState()
        }
    }

    if (status is CheckoutState.Success) {
        val successState = status as CheckoutState.Success
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp).background(Color.White),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = "Success",
                modifier = Modifier.size(100.dp),
                tint = Color(0xFF4CAF50)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "Đặt hàng thành công!",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = Color.Black
            )
            Spacer(modifier = Modifier.height(16.dp))
            Surface(
                color = Color(0xFFF9FAFB),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFFF3F4F6)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Mã đơn hàng:", color = Color.Gray)
                        Text(successState.orderCode, fontWeight = FontWeight.Bold)
                    }
                    Divider(color = Color(0xFFF3F4F6))
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Người nhận:", color = Color.Gray)
                        Text(successState.recipientName, fontWeight = FontWeight.Medium)
                    }
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Số điện thoại:", color = Color.Gray)
                        Text(successState.phone, fontWeight = FontWeight.Medium)
                    }
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Địa chỉ giao:", color = Color.Gray)
                        Text(
                            text = successState.address, 
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.weight(1f).padding(start = 16.dp),
                            textAlign = TextAlign.End
                        )
                    }
                    Divider(color = Color(0xFFF3F4F6))
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Tổng thanh toán:", color = Color.Gray, fontWeight = FontWeight.Bold)
                        Text(
                            text = "${String.format("%,.0f", successState.totalAmount)}đ", 
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFE53935)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = onCheckoutSuccess,
                    modifier = Modifier.weight(1f).height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Trang chủ", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                }
            }
        }
        return
    }

    Scaffold(
        containerColor = Color(0xFFF9FAFB),
        topBar = {
            TopAppBar(
                title = { Text("Thanh toán", fontWeight = FontWeight.Black) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            Surface(
                color = Color.White,
                shadowElevation = 16.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp).navigationBarsPadding(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { viewModel.placeOrder(voucherCode) },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935)),
                        enabled = status !is CheckoutState.Loading
                    ) {
                        if (status is CheckoutState.Loading) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Xác nhận Đặt hàng ngay", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Section 1: Address
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    border = BorderStroke(1.dp, Color(0xFFF3F4F6)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("1. Địa chỉ nhận hàng", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                            Text(
                                "Thay đổi",
                                color = Color(0xFFE53935),
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.clickable { showAddressSheet = true }.padding(4.dp)
                            )
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF3F4F6))
                        
                        if (!useCustomAddress && selectedAddressId != null) {
                            val addr = addresses.find { it.id == selectedAddressId }
                            if (addr != null) {
                                Text(addr.full_name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text(addr.phone, color = Color.Gray, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    listOfNotNull(addr.address_line, addr.ward, addr.district, addr.province).filter { it.isNotEmpty() }.joinToString(", "),
                                    color = Color.DarkGray, fontSize = 14.sp
                                )
                            }
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                OutlinedTextField(
                                    value = fullName,
                                    onValueChange = { viewModel.onFullNameChange(it) },
                                    label = { Text("Họ và tên") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                OutlinedTextField(
                                    value = phone,
                                    onValueChange = { viewModel.onPhoneChange(it) },
                                    label = { Text("Số điện thoại") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                OutlinedTextField(
                                    value = addressLine,
                                    onValueChange = { viewModel.onAddressLineChange(it) },
                                    label = { Text("Địa chỉ chi tiết") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = note,
                            onValueChange = { viewModel.onNoteChange(it) },
                            label = { Text("Ghi chú đơn hàng (Tùy chọn)") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            minLines = 2
                        )
                    }
                }
            }

            // Section 2: Payment
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    border = BorderStroke(1.dp, Color(0xFFF3F4F6)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("2. Phương thức thanh toán", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF3F4F6))
                        
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            PaymentMethodItem(
                                title = "Thanh toán khi nhận hàng (COD)",
                                subtitle = "Thanh toán bằng tiền mặt khi nhận hàng",
                                selected = paymentMethod == "cod",
                                onClick = { viewModel.onPaymentMethodChange("cod") }
                            )
                            PaymentMethodItem(
                                title = "Chuyển khoản Ngân hàng (VietQR)",
                                subtitle = "Quét mã QR tiện lợi, xác nhận siêu tốc",
                                selected = paymentMethod == "bank",
                                onClick = { viewModel.onPaymentMethodChange("bank") }
                            )
                            
                            AnimatedVisibility(visible = paymentMethod == "bank") {
                                Surface(
                                    color = Color(0xFFF9FAFB),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, Color(0xFFE5E7EB)),
                                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text("Thông tin chuyển khoản nhanh:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        Text("Ngân hàng: MB Bank (Quân Đội)", fontSize = 12.sp)
                                        Text("Số tài khoản: 1900 8888 9999", fontSize = 12.sp)
                                        Text("Chủ tài khoản: PIZZA STORE VIETNAM", fontSize = 12.sp)
                                        Text("* Nhân viên sẽ gửi mã QR ngay sau khi bạn đặt đơn.", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Section 3: Voucher Display
            if (!voucherCode.isNullOrEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF0F0)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFFE53935)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("🎫", fontSize = 24.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Voucher đang áp dụng", fontSize = 12.sp, color = Color.Gray)
                                Text(voucherCode.uppercase(), fontWeight = FontWeight.Black, color = Color(0xFFE53935))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddressSheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showAddressSheet = false },
            sheetState = sheetState,
            containerColor = Color.White
        ) {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
                Text("Chọn địa chỉ giao hàng", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(addresses.size) { index ->
                        val addr = addresses[index]
                        val isSelected = !useCustomAddress && selectedAddressId == addr.id
                        AddressSelectionItem(
                            address = addr,
                            selected = isSelected,
                            onClick = {
                                viewModel.selectAddress(addr.id)
                                showAddressSheet = false
                            }
                        )
                    }
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth().clickable {
                                viewModel.selectAddress(null)
                                showAddressSheet = false
                            },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, if (useCustomAddress) Color(0xFFE53935) else Color(0xFFE0E0E0)),
                            color = if (useCustomAddress) Color(0xFFFFF0F0) else Color.White
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(selected = useCustomAddress, onClick = null, colors = RadioButtonDefaults.colors(selectedColor = Color(0xFFE53935)))
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("Giao đến địa chỉ khác / Nhập mới", fontWeight = FontWeight.Bold, color = Color.DarkGray)
                            }
                        }
                    }
                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }
        }
    }
}

@Composable
fun PaymentMethodItem(title: String, subtitle: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, if (selected) Color(0xFFE53935) else Color(0xFFE5E7EB)),
        color = if (selected) Color(0xFFFFF0F0) else Color.White
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            RadioButton(selected = selected, onClick = null, colors = RadioButtonDefaults.colors(selectedColor = Color(0xFFE53935)))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(subtitle, color = Color.Gray, fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun AddressSelectionItem(address: UserAddressResponse, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, if (selected) Color(0xFFE53935) else Color(0xFFE0E0E0)),
        color = if (selected) Color(0xFFFFF0F0) else Color.White
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            RadioButton(selected = selected, onClick = null, colors = RadioButtonDefaults.colors(selectedColor = Color(0xFFE53935)))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(address.full_name, fontWeight = FontWeight.Black, fontSize = 14.sp)
                    Text(" | ${address.phone}", color = Color.Gray, fontSize = 13.sp)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(address.address_line, fontSize = 13.sp, color = Color.DarkGray)
                Text(listOfNotNull(address.ward, address.district, address.province).filter { it.isNotEmpty() }.joinToString(", "), fontSize = 12.sp, color = Color.Gray)
                
                if (address.is_default) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Surface(color = Color(0xFFFFCDD2), shape = RoundedCornerShape(4.dp)) {
                        Text("Mặc định", color = Color(0xFFC62828), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
            }
        }
    }
}
