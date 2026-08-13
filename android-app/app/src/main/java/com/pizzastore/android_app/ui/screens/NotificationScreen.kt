package com.pizzastore.android_app.ui.screens

import android.widget.Toast
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pizzastore.android_app.network.NotificationResponse
import com.pizzastore.android_app.viewmodel.NotificationViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScreen(
    viewModel: NotificationViewModel,
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Thông báo chung", "Khuyến mãi")

    // Handle toast messages
    LaunchedEffect(uiState.toastMessage) {
        if (uiState.toastMessage != null) {
            Toast.makeText(context, uiState.toastMessage, Toast.LENGTH_SHORT).show()
            viewModel.clearToast()
        }
    }

    Scaffold(
        containerColor = Color(0xFFF8F9FA),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Thông báo",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Color.Black
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tab row
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = MaterialTheme.colorScheme.primary,
                indicator = { tabPositions ->
                    if (selectedTab < tabPositions.size) {
                        TabRowDefaults.Indicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = MaterialTheme.colorScheme.primary,
                            height = 3.dp
                        )
                    }
                }
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        selectedContentColor = MaterialTheme.colorScheme.primary,
                        unselectedContentColor = Color.Gray,
                        text = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(title, fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal)
                                val unread = if (index == 0) uiState.generalUnreadCount else uiState.voucherUnreadCount
                                if (unread > 0) {
                                    Surface(
                                        shape = CircleShape,
                                        color = MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(18.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = if (unread > 9) "9+" else unread.toString(),
                                                color = Color.White,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    )
                }
            }

            // Tab content
            when (selectedTab) {
                0 -> NotificationTabContent(
                    notifications = uiState.generalNotifications,
                    unreadCount = uiState.generalUnreadCount,
                    isLoading = uiState.isLoading,
                    onMarkAllRead = { viewModel.markAllAsRead("general") },
                    onClearAll = { viewModel.clearAll("general") },
                    onItemClick = { notif ->
                        if (!notif.is_read) viewModel.markAsRead(notif.id)
                    }
                )
                1 -> VoucherNotificationTabContent(
                    notifications = uiState.voucherNotifications,
                    unreadCount = uiState.voucherUnreadCount,
                    isLoading = uiState.isLoading,
                    savingIds = uiState.savingVoucherIds,
                    savedIds = uiState.savedVoucherNotificationIds,
                    onMarkAllRead = { viewModel.markAllAsRead("voucher") },
                    onClearAll = { viewModel.clearAll("voucher") },
                    onSaveVoucher = { code, notifId ->
                        viewModel.saveVoucher(code, notifId)
                    }
                )
            }
        }
    }
}

@Composable
private fun NotificationTabContent(
    notifications: List<NotificationResponse>,
    unreadCount: Int,
    isLoading: Boolean,
    onMarkAllRead: () -> Unit,
    onClearAll: () -> Unit,
    onItemClick: (NotificationResponse) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Action header row
        if (notifications.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.End
            ) {
                if (unreadCount > 0) {
                    TextButton(onClick = onMarkAllRead) {
                        Text("Đánh dấu tất cả đã đọc", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
                    }
                } else {
                    TextButton(onClick = onClearAll) {
                        Text("Xóa tất cả", color = Color.Red, fontSize = 13.sp)
                    }
                }
            }
            HorizontalDivider()
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Notifications,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.LightGray
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Chưa có thông báo nào", color = Color.Gray, fontSize = 15.sp)
                }
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(notifications, key = { it.id }) { notif ->
                    GeneralNotificationItem(
                        notification = notif,
                        onClick = { onItemClick(notif) }
                    )
                    HorizontalDivider(color = Color(0xFFF0F0F0))
                }
            }
        }
    }
}

@Composable
private fun VoucherNotificationTabContent(
    notifications: List<NotificationResponse>,
    unreadCount: Int,
    isLoading: Boolean,
    savingIds: Set<Int>,
    savedIds: Set<Int>,
    onMarkAllRead: () -> Unit,
    onClearAll: () -> Unit,
    onSaveVoucher: (String, Int) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Action header row
        if (notifications.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.End
            ) {
                // For voucher tab: "unread" means voucher not yet saved
                val hasUnsaved = notifications.any { !it.is_read && it.id !in savedIds }
                if (hasUnsaved) {
                    TextButton(onClick = onMarkAllRead) {
                        Text("Đánh dấu tất cả đã đọc", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
                    }
                } else {
                    TextButton(onClick = onClearAll) {
                        Text("Xóa tất cả", color = Color.Red, fontSize = 13.sp)
                    }
                }
            }
            HorizontalDivider()
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.LightGray
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Chưa có ưu đãi nào", color = Color.Gray, fontSize = 15.sp)
                }
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(notifications, key = { it.id }) { notif ->
                    VoucherNotificationItem(
                        notification = notif,
                        isSaving = notif.id in savingIds,
                        isSaved = notif.id in savedIds || notif.is_read,
                        onSaveVoucher = {
                            val code = notif.reference_code
                            if (code != null) onSaveVoucher(code, notif.id)
                        }
                    )
                    HorizontalDivider(color = Color(0xFFF0F0F0))
                }
            }
        }
    }
}

@Composable
private fun GeneralNotificationItem(
    notification: NotificationResponse,
    onClick: () -> Unit
) {
    val bgColor by animateColorAsState(
        targetValue = if (!notification.is_read) Color(0xFFFFF8F0) else Color.White,
        label = "notification_bg"
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(bgColor)
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Unread dot indicator
        Box(
            modifier = Modifier
                .padding(top = 6.dp)
                .size(8.dp)
                .clip(CircleShape)
                .background(
                    if (!notification.is_read) MaterialTheme.colorScheme.primary else Color.Transparent
                )
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = notification.title,
                fontWeight = if (!notification.is_read) FontWeight.Bold else FontWeight.Medium,
                fontSize = 14.sp,
                color = Color.Black
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = notification.message,
                fontSize = 13.sp,
                color = Color.Gray,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = formatRelativeTime(notification.created_at),
                fontSize = 11.sp,
                color = Color(0xFFAAAAAA)
            )
        }
    }
}

@Composable
private fun VoucherNotificationItem(
    notification: NotificationResponse,
    isSaving: Boolean,
    isSaved: Boolean,
    onSaveVoucher: () -> Unit
) {
    val bgColor by animateColorAsState(
        targetValue = if (!isSaved && !notification.is_read) Color(0xFFF0F9FF) else Color.White,
        label = "voucher_bg"
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(bgColor)
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Voucher icon
            Surface(
                shape = CircleShape,
                color = Color(0xFFE0F2FE),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text("🎁", fontSize = 20.sp)
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = notification.title,
                    fontWeight = if (!isSaved) FontWeight.Bold else FontWeight.Medium,
                    fontSize = 14.sp,
                    color = Color.Black
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = formatRelativeTime(notification.created_at),
                    fontSize = 11.sp,
                    color = Color(0xFFAAAAAA)
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = notification.message,
            fontSize = 13.sp,
            color = Color.Gray,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis
        )

        // Voucher code chip
        if (!notification.reference_code.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Code badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFF1F5F9),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Text(
                        text = notification.reference_code,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp,
                        color = Color(0xFF334155),
                        letterSpacing = 1.sp
                    )
                }

                // Save button or saved label
                if (isSaved) {
                    Text(
                        "✓ Đã lưu vào ví",
                        color = Color(0xFF4CAF50),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                } else {
                    Button(
                        onClick = onSaveVoucher,
                        enabled = !isSaving,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFE53935)
                        ),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(14.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Lưu ngay", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private fun formatRelativeTime(createdAt: String): String {
    return try {
        val formatter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
        formatter.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = formatter.parse(createdAt.substringBefore('.')) ?: return createdAt
        val now = java.util.Date()
        val diffMs = now.time - date.time
        val diffMin = diffMs / 60000
        val diffHour = diffMin / 60
        val diffDay = diffHour / 24
        when {
            diffMin < 1 -> "Vừa xong"
            diffMin < 60 -> "${diffMin} phút trước"
            diffHour < 24 -> "${diffHour} giờ trước"
            diffDay < 7 -> "${diffDay} ngày trước"
            else -> {
                val df = java.text.SimpleDateFormat("dd/MM/yyyy", java.util.Locale.getDefault())
                df.timeZone = java.util.TimeZone.getTimeZone("Asia/Ho_Chi_Minh")
                df.format(date)
            }
        }
    } catch (e: Exception) {
        createdAt
    }
}
