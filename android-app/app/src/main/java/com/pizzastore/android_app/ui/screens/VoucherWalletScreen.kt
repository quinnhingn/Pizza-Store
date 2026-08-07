package com.pizzastore.android_app.ui.screens

import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import com.pizzastore.android_app.viewmodel.VoucherWalletState
import com.pizzastore.android_app.viewmodel.VoucherWalletViewModel

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoucherWalletScreen(
    viewModel: VoucherWalletViewModel? = null,
    onBackClick: () -> Unit
) {
    val state by viewModel?.state?.collectAsState(initial = VoucherWalletState.Loading) ?: mutableStateOf(VoucherWalletState.Loading)
    
    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = { Text("Ví Voucher", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 24.dp)
        ) {
            when (val currentState = state) {
                is VoucherWalletState.Loading -> {
                    item {
                        CircularProgressIndicator(modifier = Modifier.fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally))
                    }
                }
                is VoucherWalletState.Error -> {
                    item {
                        Text("Lỗi: ${currentState.message}", color = MaterialTheme.colorScheme.error, modifier = Modifier.fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally))
                    }
                }
                is VoucherWalletState.Success -> {
                    if (currentState.vouchers.isEmpty()) {
                        item {
                            Text("Chưa có voucher nào.", modifier = Modifier.fillMaxWidth().wrapContentWidth(Alignment.CenterHorizontally))
                        }
                    } else {
                        items(currentState.vouchers.size) { index ->
                            val voucher = currentState.vouchers[index]
                            val desc = buildString {
                                if (voucher.discount_percent != null) append("Giảm ${voucher.discount_percent}% ")
                                else if (voucher.discount_amount != null) append("Giảm ${String.format("%,.0f", voucher.discount_amount)}đ ")
                                
                                if (voucher.min_order_value != null) append("cho đơn từ ${String.format("%,.0f", voucher.min_order_value)}đ")
                            }
                            VoucherCard(
                                code = voucher.code,
                                description = desc,
                                validUntil = voucher.end_date?.take(10)?.split("-")?.reversed()?.joinToString("/") ?: "Vô thời hạn"
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VoucherCard(code: String, description: String, validUntil: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.size(60.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = code, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "HSD: $validUntil", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
