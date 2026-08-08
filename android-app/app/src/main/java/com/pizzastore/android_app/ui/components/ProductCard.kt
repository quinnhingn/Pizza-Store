package com.pizzastore.android_app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pizzastore.android_app.network.Product

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit,
    onReviewClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    isFullWidth: Boolean = false
) {
    // Determine card dimensions
    val cardModifier = if (isFullWidth) {
        modifier
            .fillMaxWidth()
            .height(145.dp)
            .padding(bottom = 12.dp)
    } else {
        modifier
            .width(330.dp)
            .height(145.dp)
            .padding(end = 12.dp, bottom = 4.dp)
    }

    Card(
        modifier = cardModifier,
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        onClick = { if (product.is_available) onClick() },
        enabled = product.is_available
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val imageUrl = if (product.image_url.isNullOrEmpty()) null
            else if (product.image_url.startsWith("http")) product.image_url
            else "http://10.0.2.2:8000/${product.image_url.removePrefix("/")}"

            // Left side: Image Area
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(135.dp)
            ) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = product.name,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                
                // Out of stock overlay
                if (!product.is_available) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.4f))
                    )
                    Surface(
                        color = Color(0xFFE50000), // Solid Red
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                    ) {
                        Text(
                            text = "Hết món",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
            }

            // Right side: Content Area
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .padding(12.dp)
            ) {
                // Top area with Title, Description, Rating (takes remaining space)
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        color = Color.Black
                    )
                    
                    if (!product.description.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = product.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            fontSize = 11.sp,
                            lineHeight = 14.sp
                        )
                    }

                    Spacer(modifier = Modifier.weight(1f)) // Push rating to bottom of this column if needed

                    if (product.total_reviews > 0) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clickable { onReviewClick?.invoke() }
                                .padding(vertical = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Rating",
                                tint = Color(0xFFFFC107),
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${if(product.average_rating > 0) String.format("%.1f", product.average_rating) else "0"} (${product.total_reviews} đánh giá)",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.Gray,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    } else {
                        Text(
                            text = "Chưa có đánh giá",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.LightGray,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(vertical = 2.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Bottom area: Price and Add Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    val smallestPrice = if (product.sizes.isNotEmpty()) {
                        product.sizes.minOf { (product.price * it.price_multiplier) + it.extra_price }
                    } else {
                        product.price
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Chỉ từ",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.Gray,
                            fontSize = 10.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "${String.format("%,.0f", smallestPrice)} đ",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary, // Red price
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))

                    // Add button
                    Surface(
                        shape = CircleShape,
                        color = if (product.is_available) MaterialTheme.colorScheme.primary else Color.LightGray,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Add",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
