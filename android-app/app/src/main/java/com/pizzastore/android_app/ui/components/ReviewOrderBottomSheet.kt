package com.pizzastore.android_app.ui.components

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pizzastore.android_app.network.OrderResponse
import com.pizzastore.android_app.network.ReviewStatusItem
import com.pizzastore.android_app.viewmodel.ReviewOrderViewModel
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewOrderBottomSheet(
    order: OrderResponse,
    reviewStatuses: List<ReviewStatusItem>,
    viewModel: ReviewOrderViewModel,
    onDismissRequest: () -> Unit,
    onSuccess: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    val context = LocalContext.current
    
    val reviewsInput by viewModel.reviewsInput.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val error by viewModel.error.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()

    // Initialize inputs for products that are not reviewed yet
    LaunchedEffect(reviewStatuses) {
        val unreviewedProductIds = reviewStatuses.filter { !it.is_reviewed }.map { it.product_id }
        if (unreviewedProductIds.isNotEmpty()) {
            viewModel.initForUnreviewedProducts(unreviewedProductIds)
        }
    }

    LaunchedEffect(successMessage) {
        if (successMessage != null) {
            onSuccess()
            viewModel.clearSuccessMessage()
            onDismissRequest()
        }
    }

    // Filter unique products
    val uniqueProducts = remember(order.items) {
        order.items?.distinctBy { it.product?.id }?.filter { it.product != null } ?: emptyList()
    }

    ModalBottomSheet(
        onDismissRequest = {
            viewModel.clearError()
            onDismissRequest()
        },
        sheetState = sheetState,
        containerColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Text(
                    text = "Đánh giá đơn hàng ${order.order_code}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                IconButton(onClick = onDismissRequest) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                }
            }

            if (error != null) {
                Text(
                    text = error!!,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }

            LazyColumn(
                modifier = Modifier.weight(1f, fill = false),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(uniqueProducts) { orderItem ->
                    val productId = orderItem.product?.id ?: return@items
                    val product = orderItem.product
                    val status = reviewStatuses.find { it.product_id == productId }
                    val isReviewed = status?.is_reviewed == true
                    val pastReview = status?.review
                    val currentInput = reviewsInput[productId]

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            // Product Info Header
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                AsyncImage(
                                    model = product.image_url,
                                    contentDescription = product.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(64.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.LightGray)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = product.name,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    if (isReviewed) {
                                        Text(
                                            text = "Đã đánh giá",
                                            color = Color(0xFF059669), // Emerald 600
                                            style = MaterialTheme.typography.labelSmall,
                                            modifier = Modifier
                                                .padding(top = 4.dp)
                                                .background(Color(0xFFD1FAE5), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            if (isReviewed && pastReview != null) {
                                // Display past review
                                Row {
                                    repeat(5) { index ->
                                        Icon(
                                            imageVector = Icons.Default.Star,
                                            contentDescription = null,
                                            tint = if (index < pastReview.rating) Color(0xFFFFC107) else Color.LightGray,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }
                                if (!pastReview.comment.isNullOrEmpty()) {
                                    Text(
                                        text = pastReview.comment,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(top = 8.dp)
                                            .background(Color(0xFFF3F4F6), RoundedCornerShape(8.dp))
                                            .padding(12.dp),
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color.DarkGray
                                    )
                                }
                                if (!pastReview.image_url.isNullOrEmpty()) {
                                    AsyncImage(
                                        model = pastReview.image_url,
                                        contentDescription = "Review image",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .padding(top = 8.dp)
                                            .size(80.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .border(1.dp, Color.LightGray, RoundedCornerShape(8.dp))
                                    )
                                }
                            } else if (currentInput != null) {
                                // Review Input Form
                                // Rating
                                Row(modifier = Modifier.padding(bottom = 12.dp)) {
                                    repeat(5) { index ->
                                        Icon(
                                            imageVector = Icons.Default.Star,
                                            contentDescription = "Rate ${index + 1}",
                                            tint = if (index < currentInput.rating) Color(0xFFFFC107) else Color.LightGray,
                                            modifier = Modifier
                                                .size(32.dp)
                                                .clickable { viewModel.updateRating(productId, index + 1) }
                                                .padding(2.dp)
                                        )
                                    }
                                }

                                // Comment
                                OutlinedTextField(
                                    value = currentInput.comment,
                                    onValueChange = { viewModel.updateComment(productId, it) },
                                    placeholder = { Text("Chia sẻ cảm nhận của bạn về món ăn này nhé...", color = Color.Gray) },
                                    modifier = Modifier.fillMaxWidth(),
                                    minLines = 3,
                                    shape = RoundedCornerShape(12.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                                        unfocusedBorderColor = Color.LightGray
                                    )
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                // Image Upload
                                val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
                                    if (uri != null) {
                                        // Copy uri to temp file
                                        val tempFile = File(context.cacheDir, "review_img_${System.currentTimeMillis()}.jpg")
                                        context.contentResolver.openInputStream(uri)?.use { input ->
                                            FileOutputStream(tempFile).use { output ->
                                                input.copyTo(output)
                                            }
                                        }
                                        viewModel.uploadImage(productId, tempFile)
                                    }
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (currentInput.imageUrl != null) {
                                        Box(
                                            modifier = Modifier
                                                .size(80.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .border(1.dp, Color.LightGray, RoundedCornerShape(12.dp))
                                        ) {
                                            AsyncImage(
                                                model = currentInput.imageUrl,
                                                contentDescription = "Uploaded image",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            IconButton(
                                                onClick = { viewModel.removeImage(productId) },
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .size(24.dp)
                                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(bottomStart = 8.dp))
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Close,
                                                    contentDescription = "Remove image",
                                                    tint = Color.White,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .size(80.dp)
                                                .border(1.dp, Color.LightGray, RoundedCornerShape(12.dp))
                                                .clickable(enabled = !currentInput.isUploading) { launcher.launch("image/*") }
                                                .padding(8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (currentInput.isUploading) {
                                                CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                                            } else {
                                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                    Icon(imageVector = Icons.Default.Add, contentDescription = "Upload", tint = Color.Gray)
                                                    Text("Thêm ảnh", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
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

            // Footer Actions
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 32.dp),
                horizontalArrangement = Arrangement.End
            ) {
                OutlinedButton(
                    onClick = onDismissRequest,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Trở lại", color = Color.DarkGray)
                }
                Spacer(modifier = Modifier.width(12.dp))
                
                if (reviewsInput.isNotEmpty()) {
                    Button(
                        onClick = { viewModel.submitReviews(order.id) },
                        enabled = !isSubmitting,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text("Gửi Đánh Giá", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
