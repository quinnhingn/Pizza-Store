package com.pizzastore.android_app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pizzastore.android_app.ui.theme.*

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (label, bgColor, textColor, borderColor) = when (status.lowercase()) {
        "pending" -> listOf("Chờ xác nhận", Amber50, Amber600, Amber200)
        "confirmed" -> listOf("Đã xác nhận", Blue50, Blue600, Blue200)
        "shipping" -> listOf("Đang giao hàng", Indigo50, Indigo600, Indigo200)
        "completed" -> listOf("Hoàn thành", Emerald50, Emerald600, Emerald200)
        "cancelled" -> listOf("Đã hủy", Rose50, Rose600, Rose200)
        else -> listOf(status, Slate100, Slate800, Slate200)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor as Color)
            .border(1.dp, borderColor as Color, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label as String,
            color = textColor as Color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
