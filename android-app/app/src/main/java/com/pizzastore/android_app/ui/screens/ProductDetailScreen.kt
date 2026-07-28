package com.pizzastore.android_app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pizzastore.android_app.network.Product
import com.pizzastore.android_app.network.ProductSizeItem
import com.pizzastore.android_app.network.ProductToppingItem
import com.pizzastore.android_app.viewmodel.ProductDetailState
import com.pizzastore.android_app.viewmodel.ProductDetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    viewModel: ProductDetailViewModel,
    onBackClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val selectedSize by viewModel.selectedSize.collectAsState()
    val selectedToppings by viewModel.selectedToppings.collectAsState()
    val quantity by viewModel.quantity.collectAsState()
    val totalPrice by viewModel.totalPrice.collectAsState()
    val isAddingToCart by viewModel.isAddingToCart.collectAsState()
    val addToCartResult by viewModel.addToCartResult.collectAsState()
    
    val context = LocalContext.current

    LaunchedEffect(addToCartResult) {
        if (addToCartResult == true) {
            Toast.makeText(context, "Thêm vào giỏ hàng thành công", Toast.LENGTH_SHORT).show()
            viewModel.resetAddToCartResult()
            onBackClick()
        } else if (addToCartResult == false) {
            Toast.makeText(context, "Thêm vào giỏ hàng thất bại", Toast.LENGTH_SHORT).show()
            viewModel.resetAddToCartResult()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        bottomBar = {
            if (state is ProductDetailState.Success) {
                val product = (state as ProductDetailState.Success).product
                
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 16.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .navigationBarsPadding(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Quantity Selector
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(24.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            TextButton(onClick = { viewModel.decreaseQuantity() }, modifier = Modifier.size(36.dp), contentPadding = PaddingValues(0.dp)) {
                                Text("-", fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                            }
                            Text(
                                text = quantity.toString(),
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                            TextButton(onClick = { viewModel.increaseQuantity() }, modifier = Modifier.size(36.dp), contentPadding = PaddingValues(0.dp)) {
                                Text("+", fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                        
                        // Add to Cart Button
                        Button(
                            onClick = { 
                                if (!isAddingToCart) {
                                    viewModel.addToCart()
                                }
                            },
                            modifier = Modifier
                                .weight(1f)
                                .padding(start = 16.dp)
                                .height(50.dp),
                            shape = RoundedCornerShape(24.dp),
                            enabled = !isAddingToCart
                        ) {
                            if (isAddingToCart) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = MaterialTheme.colorScheme.onPrimary,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text("Thêm - ${String.format("%,.0f ₫", totalPrice)}", style = MaterialTheme.typography.titleMedium)
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (val currentState = state) {
                is ProductDetailState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                is ProductDetailState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = "Error", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = "Rất tiếc! Không thể tải sản phẩm.", style = MaterialTheme.typography.titleMedium)
                        Text(text = currentState.message, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadProduct() }) {
                            Text("Thử lại")
                        }
                    }
                }
                is ProductDetailState.Success -> {
                    val product = currentState.product
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Product Image
                        val imageUrl = if (product.image_url.isNullOrEmpty()) null 
                            else if (product.image_url.startsWith("http")) product.image_url 
                            else "http://10.0.2.2:8000/${product.image_url.removePrefix("/")}"

                        Box(
                            modifier = Modifier.fillMaxWidth().height(250.dp).padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = imageUrl,
                                contentDescription = product.name,
                                modifier = Modifier.size(220.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                        }

                        // Product Info
                        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                            Text(
                                text = product.name,
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = String.format("%,.0f ₫", product.price),
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Icon(Icons.Default.Star, contentDescription = "Rating", tint = Color(0xFFFFC107), modifier = Modifier.size(20.dp))
                                Text(text = " 4.8 (120+)", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(text = "Chi tiết", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = product.description ?: "Một chiếc bánh pizza thơm ngon đang chờ bạn thưởng thức.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            // Sizes
                            if (product.sizes.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(24.dp))
                                Text(text = "Chọn Size", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                product.sizes.forEach { size ->
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable { viewModel.selectSize(size) }
                                            .padding(vertical = 4.dp)
                                    ) {
                                        RadioButton(
                                            selected = selectedSize?.id == size.id,
                                            onClick = { viewModel.selectSize(size) }
                                        )
                                        Text(
                                            text = size.size_name,
                                            modifier = Modifier.weight(1f).padding(start = 8.dp),
                                            style = MaterialTheme.typography.bodyLarge
                                        )
                                        if (size.extra_price > 0) {
                                            Text(
                                                text = "+${String.format("%,.0f", size.extra_price)} ₫",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = Color.Gray
                                            )
                                        }
                                    }
                                }
                            }

                            // Toppings
                            if (product.toppings.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(24.dp))
                                Text(text = "Thêm Topping", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                product.toppings.forEach { topping ->
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable { viewModel.toggleTopping(topping) }
                                            .padding(vertical = 4.dp)
                                    ) {
                                        Checkbox(
                                            checked = selectedToppings.contains(topping),
                                            onCheckedChange = { viewModel.toggleTopping(topping) }
                                        )
                                        Text(
                                            text = topping.topping_name,
                                            modifier = Modifier.weight(1f).padding(start = 8.dp),
                                            style = MaterialTheme.typography.bodyLarge
                                        )
                                        if (topping.extra_price > 0) {
                                            Text(
                                                text = "+${String.format("%,.0f", topping.extra_price)} ₫",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = Color.Gray
                                            )
                                        }
                                    }
                                }
                            }
                            
                            // Padding at the bottom for the fixed BottomBar
                            Spacer(modifier = Modifier.height(32.dp))
                        }
                    }
                }
            }
        }
    }
}
