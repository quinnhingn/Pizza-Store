package com.pizzastore.android_app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
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
import com.pizzastore.android_app.network.Product

import com.pizzastore.android_app.network.PublicReviewItem
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductReviewsBottomSheet(
    product: Product,
    reviews: List<PublicReviewItem>,
    isLoading: Boolean,
    onDismissRequest: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)

    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        sheetState = sheetState,
        containerColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Đánh giá: ${product.name}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Rating",
                            tint = Color(0xFFFFC107),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${if (product.average_rating > 0) String.format("%.1f", product.average_rating) else "0"} / 5.0",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = " (${product.total_reviews} đánh giá)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.Gray
                        )
                    }
                }
            }

            Divider(color = Color.LightGray, thickness = 0.5.dp)

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFFE53935))
                }
            } else if (product.total_reviews == 0 || reviews.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "Chưa có đánh giá nào cho sản phẩm này.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(reviews) { review ->
                        ReviewItem(review)
                        Divider(color = Color.LightGray.copy(alpha = 0.5f), thickness = 0.5.dp, modifier = Modifier.padding(top = 16.dp))
                    }
                }
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun ReviewItem(review: PublicReviewItem) {
    val userName = review.user?.full_name ?: "Khách hàng"
    
    // Format date
    val dateStr = try {
        val formatClean = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val date = formatClean.parse(review.created_at.take(19))
        val formatOut = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        if (date != null) formatOut.format(date) else review.created_at
    } catch (e: Exception) {
        review.created_at
    }

    Row(modifier = Modifier.fillMaxWidth()) {
        // Avatar mock
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = userName.first().uppercase(),
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = userName,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = dateStr,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
            
            Row(modifier = Modifier.padding(vertical = 4.dp)) {
                repeat(5) { index ->
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = if (index < review.rating) Color(0xFFFFC107) else Color.LightGray,
                        modifier = Modifier.size(12.dp)
                    )
                }
            }
            
            if (!review.comment.isNullOrEmpty()) {
                Text(
                    text = review.comment,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.DarkGray,
                    lineHeight = 16.sp,
                    modifier = Modifier.padding(bottom = if (review.image_url != null) 8.dp else 0.dp)
                )
            }
            
            if (review.image_url != null) {
                AsyncImage(
                    model = review.image_url,
                    contentDescription = "Review Image",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(8.dp))
                )
            }
        }
    }
}
