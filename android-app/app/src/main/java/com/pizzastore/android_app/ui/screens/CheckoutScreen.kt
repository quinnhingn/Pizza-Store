package com.pizzastore.android_app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
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
    val state by viewModel.state.collectAsState()
    val fullName by viewModel.fullName.collectAsState()
    val phone by viewModel.phone.collectAsState()
    val address by viewModel.address.collectAsState()
    val note by viewModel.note.collectAsState()
    
    val context = LocalContext.current

    LaunchedEffect(state) {
        if (state is CheckoutState.Error) {
            Toast.makeText(context, (state as CheckoutState.Error).message, Toast.LENGTH_SHORT).show()
            viewModel.resetState()
        }
    }

    if (state is CheckoutState.Success) {
        // Success screen
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
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
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Mã đơn hàng: ${(state as CheckoutState.Success).orderCode}",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.Gray
            )
            Spacer(modifier = Modifier.height(32.dp))
            Button(
                onClick = onCheckoutSuccess,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(25.dp)
            ) {
                Text("Về trang chủ", style = MaterialTheme.typography.titleMedium)
            }
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thanh toán", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        bottomBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 16.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = { viewModel.placeOrder(voucherCode) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .navigationBarsPadding()
                        .height(50.dp),
                    shape = RoundedCornerShape(25.dp),
                    enabled = state !is CheckoutState.Loading
                ) {
                    if (state is CheckoutState.Loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Xác nhận đặt hàng", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(16.dp))
            Text("Thông tin giao hàng", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = fullName,
                onValueChange = { viewModel.onFullNameChange(it) },
                label = { Text("Họ và tên") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = phone,
                onValueChange = { viewModel.onPhoneChange(it) },
                label = { Text("Số điện thoại") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = address,
                onValueChange = { viewModel.onAddressChange(it) },
                label = { Text("Địa chỉ giao hàng chi tiết") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = note,
                onValueChange = { viewModel.onNoteChange(it) },
                label = { Text("Ghi chú (Tùy chọn)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                minLines = 3
            )
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
