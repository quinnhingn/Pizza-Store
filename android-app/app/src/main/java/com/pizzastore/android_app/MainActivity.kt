package com.pizzastore.android_app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.pizzastore.android_app.network.AuthApiService
import com.pizzastore.android_app.network.NetworkModule
import com.pizzastore.android_app.network.ProductApiService
import com.pizzastore.android_app.network.CartApiService
import com.pizzastore.android_app.network.OrderApiService
import com.pizzastore.android_app.network.VoucherApiService
import com.pizzastore.android_app.network.BannerApiService
import com.pizzastore.android_app.network.CategoryApiService
import com.pizzastore.android_app.repository.AuthRepository
import com.pizzastore.android_app.repository.ProductRepository
import com.pizzastore.android_app.repository.CartRepository
import com.pizzastore.android_app.repository.OrderRepository
import com.pizzastore.android_app.repository.VoucherRepository
import com.pizzastore.android_app.repository.BannerRepository
import com.pizzastore.android_app.repository.CategoryRepository
import com.pizzastore.android_app.repository.UserRepository
import com.pizzastore.android_app.network.UserApiService
import com.pizzastore.android_app.ui.screens.HomeScreen
import com.pizzastore.android_app.ui.screens.MenuScreen
import com.pizzastore.android_app.ui.screens.LoginScreen
import com.pizzastore.android_app.ui.screens.ProductDetailScreen
import com.pizzastore.android_app.ui.screens.CartScreen
import com.pizzastore.android_app.ui.screens.CheckoutScreen
import com.pizzastore.android_app.ui.screens.ProfileScreen
import com.pizzastore.android_app.ui.screens.AddressBookScreen
import com.pizzastore.android_app.ui.screens.OrderHistoryScreen
import com.pizzastore.android_app.ui.screens.VoucherWalletScreen
import com.pizzastore.android_app.ui.screens.WelcomeScreen
import com.pizzastore.android_app.ui.screens.RegisterScreen
import com.pizzastore.android_app.ui.screens.ChatbotScreen
import com.pizzastore.android_app.ui.theme.AndroidappTheme
import com.pizzastore.android_app.utils.TokenManager
import com.pizzastore.android_app.viewmodel.HomeViewModel
import com.pizzastore.android_app.viewmodel.HomeViewModelFactory
import com.pizzastore.android_app.viewmodel.LoginViewModel
import com.pizzastore.android_app.viewmodel.LoginViewModelFactory
import com.pizzastore.android_app.viewmodel.RegisterViewModel
import com.pizzastore.android_app.viewmodel.RegisterViewModelFactory
import com.pizzastore.android_app.viewmodel.ProductDetailViewModel
import com.pizzastore.android_app.viewmodel.ProductDetailViewModelFactory
import com.pizzastore.android_app.viewmodel.CartViewModel
import com.pizzastore.android_app.viewmodel.CartViewModelFactory
import com.pizzastore.android_app.viewmodel.CheckoutViewModel
import com.pizzastore.android_app.viewmodel.CheckoutViewModelFactory
import com.pizzastore.android_app.viewmodel.ProfileViewModel
import com.pizzastore.android_app.viewmodel.ProfileViewModelFactory
import com.pizzastore.android_app.viewmodel.AddressViewModel
import com.pizzastore.android_app.viewmodel.AddressViewModelFactory
import com.pizzastore.android_app.viewmodel.OrderHistoryViewModel
import com.pizzastore.android_app.viewmodel.OrderHistoryViewModelFactory
import com.pizzastore.android_app.viewmodel.VoucherWalletViewModel
import com.pizzastore.android_app.viewmodel.VoucherWalletViewModelFactory
import com.pizzastore.android_app.repository.NotificationRepository
import com.pizzastore.android_app.viewmodel.NotificationViewModel
import com.pizzastore.android_app.viewmodel.NotificationViewModelFactory
import com.pizzastore.android_app.ui.screens.NotificationScreen


class MainActivity : ComponentActivity() {

    // Simple manual DI for Phase 6 setup
    private lateinit var tokenManager: TokenManager
    private lateinit var authRepository: AuthRepository
    private lateinit var productRepository: ProductRepository
    private lateinit var cartRepository: CartRepository
    private lateinit var orderRepository: OrderRepository
    private lateinit var voucherRepository: VoucherRepository
    private lateinit var bannerRepository: BannerRepository
    private lateinit var categoryRepository: CategoryRepository
    private lateinit var userRepository: UserRepository
    private lateinit var chatRepository: com.pizzastore.android_app.repository.ChatRepository
    private lateinit var webSocketManager: com.pizzastore.android_app.network.WebSocketManager
    private lateinit var notificationRepository: NotificationRepository
    private lateinit var reviewRepository: com.pizzastore.android_app.repository.ReviewRepository
    
    private val loginViewModel: LoginViewModel by viewModels {
        LoginViewModelFactory(authRepository, cartRepository)
    }

    private val registerViewModel: RegisterViewModel by viewModels {
        RegisterViewModelFactory(authRepository)
    }
    
    private val homeViewModel: HomeViewModel by viewModels {
        HomeViewModelFactory(productRepository, cartRepository, bannerRepository, categoryRepository, reviewRepository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize dependencies
        tokenManager = TokenManager(applicationContext)
        val okHttpClient = NetworkModule.provideOkHttpClient(tokenManager)
        val retrofit = NetworkModule.provideRetrofit(okHttpClient)
        
        val authApiService = retrofit.create(AuthApiService::class.java)
        authRepository = AuthRepository(authApiService, tokenManager)
        
        val productApiService = retrofit.create(ProductApiService::class.java)
        productRepository = ProductRepository(productApiService)

        val guestCartManager = com.pizzastore.android_app.utils.GuestCartManager(applicationContext)
        val cartApiService = retrofit.create(CartApiService::class.java)
        cartRepository = CartRepository(cartApiService, tokenManager, guestCartManager)

        val orderApiService = retrofit.create(OrderApiService::class.java)
        orderRepository = OrderRepository(orderApiService)

        val voucherApiService = retrofit.create(VoucherApiService::class.java)
        voucherRepository = VoucherRepository(voucherApiService)

        val bannerApiService = retrofit.create(BannerApiService::class.java)
        bannerRepository = BannerRepository(bannerApiService)

        val categoryApiService = retrofit.create(CategoryApiService::class.java)
        categoryRepository = CategoryRepository(categoryApiService)

        val userApiService = retrofit.create(UserApiService::class.java)
        userRepository = UserRepository(userApiService)

        val chatApiService = retrofit.create(com.pizzastore.android_app.network.ChatApiService::class.java)
        chatRepository = com.pizzastore.android_app.repository.ChatRepository(chatApiService)

        webSocketManager = com.pizzastore.android_app.network.WebSocketManager(okHttpClient, tokenManager)

        val notificationApiService = retrofit.create(com.pizzastore.android_app.network.NotificationApiService::class.java)
        notificationRepository = NotificationRepository(notificationApiService)
        
        val reviewApiService = NetworkModule.provideReviewApiService(retrofit)
        val uploadApiService = NetworkModule.provideUploadApiService(retrofit)
        reviewRepository = com.pizzastore.android_app.repository.ReviewRepository(reviewApiService, uploadApiService)

        enableEdgeToEdge()
        setContent {
            AndroidappTheme {
                AppNavigation(
                    loginViewModel = loginViewModel,
                    registerViewModel = registerViewModel,
                    homeViewModel = homeViewModel,
                    productRepository = productRepository,
                    cartRepository = cartRepository,
                    orderRepository = orderRepository,
                    voucherRepository = voucherRepository,
                    userRepository = userRepository,
                    chatRepository = chatRepository,
                    webSocketManager = webSocketManager,
                    notificationRepository = notificationRepository,
                    reviewRepository = reviewRepository,
                    tokenManager = tokenManager,
                    initialRoute = if (tokenManager.getToken() != null) "home" else "welcome"
                )
            }
        }
    }
}

@Composable
fun AppNavigation(
    loginViewModel: LoginViewModel,
    registerViewModel: RegisterViewModel,
    homeViewModel: HomeViewModel,
    productRepository: ProductRepository,
    cartRepository: CartRepository,
    orderRepository: OrderRepository,
    voucherRepository: VoucherRepository,
    userRepository: UserRepository,
    chatRepository: com.pizzastore.android_app.repository.ChatRepository,
    webSocketManager: com.pizzastore.android_app.network.WebSocketManager,
    notificationRepository: NotificationRepository,
    reviewRepository: com.pizzastore.android_app.repository.ReviewRepository,
    tokenManager: TokenManager,
    initialRoute: String
) {
    val navController = rememberNavController()
    
    LaunchedEffect(Unit) {
        tokenManager.sessionExpired.collect {
            navController.navigate("welcome") {
                popUpTo(0) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(tokenManager.getToken()) {
        if (tokenManager.getToken() != null) {
            webSocketManager.connect()
        } else {
            webSocketManager.disconnect()
        }
    }

    NavHost(
        navController = navController,
        startDestination = initialRoute,
        modifier = Modifier.fillMaxSize()
    ) {
            composable("welcome") {
                WelcomeScreen(
                    onLoginClick = { navController.navigate("login") },
                    onGuestClick = {
                        navController.navigate("home") {
                            popUpTo("welcome") { inclusive = true }
                        }
                    }
                )
            }
            composable("login") {
                LoginScreen(
                    viewModel = loginViewModel,
                    onLoginSuccess = {
                        navController.navigate("home") {
                            popUpTo("login") { inclusive = true }
                        }
                    },
                    onRegisterClick = { navController.navigate("register") },
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable("register") {
                RegisterScreen(
                    viewModel = registerViewModel,
                    onRegisterSuccess = {
                        navController.navigate("login") {
                            popUpTo("register") { inclusive = true }
                        }
                    },
                    onLoginClick = { navController.popBackStack() }
                )
            }
            composable("home") {
                HomeScreen(
                    viewModel = homeViewModel,
                    onProductClick = { productId ->
                        navController.navigate("detail/$productId")
                    },
                    onCartClick = {
                        navController.navigate("cart")
                    },
                    onMenuClick = {
                        navController.navigate("menu")
                    },
                    onProfileClick = {
                        navController.navigate("profile")
                    },
                    onChatbotClick = {
                        navController.navigate("chatbot")
                    },
                    onNotificationClick = {
                        navController.navigate("notifications")
                    }
                )
            }
            composable("menu") {
                MenuScreen(
                    viewModel = homeViewModel,
                    onProductClick = { productId ->
                        navController.navigate("detail/$productId")
                    },
                    onCartClick = {
                        navController.navigate("cart")
                    },
                    onHomeClick = {
                        navController.navigate("home") {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onProfileClick = {
                        navController.navigate("profile")
                    },
                    onChatbotClick = {
                        navController.navigate("chatbot")
                    }
                )
            }
            composable(
                route = "detail/{productId}",
                arguments = listOf(navArgument("productId") { type = NavType.IntType })
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getInt("productId") ?: return@composable
                
                // For a specific screen, we can create the ViewModel here or use Hilt.
                // Here we use a manual factory with the provided repository and productId.
                val detailViewModel: ProductDetailViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = ProductDetailViewModelFactory(productRepository, cartRepository, reviewRepository, productId)
                )
                
                ProductDetailScreen(
                    viewModel = detailViewModel,
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable("cart") {
                val cartViewModel: CartViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = CartViewModelFactory(cartRepository, orderRepository, voucherRepository)
                )
                CartScreen(
                    viewModel = cartViewModel,
                    onCheckoutClick = { voucherCode ->
                        if (tokenManager.getToken() != null) {
                            val route = if (voucherCode != null) "checkout?voucherCode=$voucherCode" else "checkout"
                            navController.navigate(route)
                        } else {
                            navController.navigate("login")
                        }
                    },
                    onBackClick = { navController.popBackStack() },
                    onEditClick = { cartItemId, productId ->
                        navController.navigate("cart_edit/$cartItemId/$productId")
                    }
                )
            }
            composable(
                route = "cart_edit/{cartItemId}/{productId}",
                arguments = listOf(
                    navArgument("cartItemId") { type = NavType.IntType },
                    navArgument("productId") { type = NavType.IntType }
                )
            ) { backStackEntry ->
                val cartItemId = backStackEntry.arguments?.getInt("cartItemId") ?: return@composable
                val productId = backStackEntry.arguments?.getInt("productId") ?: return@composable
                
                val detailViewModel: ProductDetailViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = ProductDetailViewModelFactory(productRepository, cartRepository, reviewRepository, productId, cartItemId)
                )
                
                ProductDetailScreen(
                    viewModel = detailViewModel,
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable(
                route = "checkout?voucherCode={voucherCode}",
                arguments = listOf(navArgument("voucherCode") {
                    type = NavType.StringType
                    nullable = true
                })
            ) { backStackEntry ->
                val voucherCode = backStackEntry.arguments?.getString("voucherCode")
                val checkoutViewModel: CheckoutViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = CheckoutViewModelFactory(orderRepository, userRepository, cartRepository)
                )
                CheckoutScreen(
                    viewModel = checkoutViewModel,
                    voucherCode = voucherCode,
                    onBackClick = { navController.popBackStack() },
                    onCheckoutSuccess = {
                        navController.navigate("home") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable("profile") {
                val profileViewModel: ProfileViewModel? = if (tokenManager.getToken() != null) {
                    androidx.lifecycle.viewmodel.compose.viewModel(
                        factory = ProfileViewModelFactory(userRepository)
                    )
                } else null
                
                ProfileScreen(
                    viewModel = profileViewModel,
                    isLoggedIn = tokenManager.getToken() != null,
                    onLoginClick = { navController.navigate("login") },
                    onRegisterClick = { navController.navigate("register") },
                    onBackClick = { navController.popBackStack() },
                    onHomeClick = {
                        navController.navigate("home") {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onMenuClick = {
                        navController.navigate("menu")
                    },
                    onLogoutClick = {
                        tokenManager.clearToken()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    onAddressClick = { navController.navigate("address") },
                    onOrdersClick = { navController.navigate("orders/history") },
                    onTrackingClick = { navController.navigate("orders/tracking") },
                    onVoucherClick = { navController.navigate("vouchers") }
                )
            }
            composable("address") {
                val addressViewModel: AddressViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = AddressViewModelFactory(userRepository)
                )
                AddressBookScreen(
                    viewModel = addressViewModel,
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable(
                route = "orders/{type}",
                arguments = listOf(navArgument("type") { type = NavType.StringType; defaultValue = "tracking" })
            ) { backStackEntry ->
                val type = backStackEntry.arguments?.getString("type") ?: "tracking"
                val orderHistoryViewModel: OrderHistoryViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = OrderHistoryViewModelFactory(orderRepository, webSocketManager)
                )
                // Need to set screen type in ViewModel
                LaunchedEffect(type) {
                    orderHistoryViewModel.setScreenType(type)
                }

                OrderHistoryScreen(
                    viewModel = orderHistoryViewModel,
                    reviewOrderViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                        factory = com.pizzastore.android_app.viewmodel.ReviewOrderViewModelFactory(reviewRepository)
                    ),
                    screenType = type,
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable("vouchers") {
                val voucherWalletViewModel: VoucherWalletViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = VoucherWalletViewModelFactory(voucherRepository)
                )
                VoucherWalletScreen(
                    viewModel = voucherWalletViewModel,
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable("notifications") {
                val notifViewModel: NotificationViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = NotificationViewModelFactory(notificationRepository, voucherRepository, webSocketManager)
                )
                NotificationScreen(
                    viewModel = notifViewModel,
                    onBackClick = { navController.popBackStack() }
                )
            }
            composable("chatbot") {
                val chatbotViewModel: com.pizzastore.android_app.viewmodel.ChatbotViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = com.pizzastore.android_app.viewmodel.ChatbotViewModelFactory(chatRepository)
                )
                ChatbotScreen(
                    viewModel = chatbotViewModel,
                    onBackClick = { navController.popBackStack() },
                    onProductClick = { productId ->
                        navController.navigate("detail/$productId")
                    }
                )
            }
        }
}