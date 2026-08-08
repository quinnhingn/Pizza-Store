package com.pizzastore.android_app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pizzastore.android_app.network.Product

data class MockReview(
    val id: Int,
    val userName: String,
    val rating: Int,
    val content: String,
    val date: String
)

val mockReviewsData = listOf(
    MockReview(1, "Nguyễn Văn A", 5, "Pizza rất ngon, đế bánh giòn, topping đầy đặn. Sẽ ủng hộ tiếp!", "12/08/2026"),
    MockReview(2, "Trần Thị B", 4, "Giao hàng nhanh, đóng gói cẩn thận nhưng hơi ít phô mai.", "10/08/2026"),
    MockReview(3, "Lê Hoàng C", 5, "Hương vị tuyệt vời, giá cả hợp lý so với chất lượng.", "05/08/2026"),
    MockReview(4, "Phạm D", 3, "Bánh hơi nguội khi nhận được, cần cải thiện tốc độ giao hàng.", "01/08/2026")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductReviewsBottomSheet(
    product: Product,
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

            if (product.total_reviews == 0) {
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
                    // Show reviews based on total_reviews to simulate data.
                    items(mockReviewsData.take(product.total_reviews.coerceAtLeast(1))) { review ->
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
fun ReviewItem(review: MockReview) {
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
                text = review.userName.first().uppercase(),
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
                    text = review.userName,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = review.date,
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
            
            Text(
                text = review.content,
                style = MaterialTheme.typography.bodySmall,
                color = Color.DarkGray,
                lineHeight = 16.sp
            )
        }
    }
}
