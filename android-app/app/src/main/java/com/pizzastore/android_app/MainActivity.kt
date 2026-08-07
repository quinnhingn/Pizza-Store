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
    
    private val loginViewModel: LoginViewModel by viewModels {
        LoginViewModelFactory(authRepository)
    }

    private val registerViewModel: RegisterViewModel by viewModels {
        RegisterViewModelFactory(authRepository)
    }
    
    private val homeViewModel: HomeViewModel by viewModels {
        HomeViewModelFactory(productRepository, cartRepository, bannerRepository, categoryRepository)
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

        val cartApiService = retrofit.create(CartApiService::class.java)
        cartRepository = CartRepository(cartApiService)

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

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = initialRoute,
            modifier = Modifier.padding(innerPadding)
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
                    onProfileClick = {
                        navController.navigate("profile")
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
                    factory = ProductDetailViewModelFactory(productRepository, cartRepository, productId)
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
                    factory = ProductDetailViewModelFactory(productRepository, cartRepository, productId, cartItemId)
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
                    factory = CheckoutViewModelFactory(orderRepository, userRepository)
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
                    onLogoutClick = {
                        tokenManager.clearToken()
                        navController.navigate("welcome") {
                            popUpTo(0) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    onAddressClick = { navController.navigate("address") },
                    onOrdersClick = { navController.navigate("orders") },
                    onTrackingClick = { navController.navigate("orders") },
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
            composable("orders") {
                val orderHistoryViewModel: OrderHistoryViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = OrderHistoryViewModelFactory(orderRepository)
                )
                OrderHistoryScreen(
                    viewModel = orderHistoryViewModel,
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
        }
    }
}