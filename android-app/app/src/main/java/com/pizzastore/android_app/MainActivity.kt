package com.pizzastore.android_app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.pizzastore.android_app.network.AuthApiService
import com.pizzastore.android_app.network.NetworkModule
import com.pizzastore.android_app.network.ProductApiService
import com.pizzastore.android_app.network.CartApiService
import com.pizzastore.android_app.network.OrderApiService
import com.pizzastore.android_app.repository.AuthRepository
import com.pizzastore.android_app.repository.ProductRepository
import com.pizzastore.android_app.repository.CartRepository
import com.pizzastore.android_app.repository.OrderRepository
import com.pizzastore.android_app.ui.screens.HomeScreen
import com.pizzastore.android_app.ui.screens.LoginScreen
import com.pizzastore.android_app.ui.screens.ProductDetailScreen
import com.pizzastore.android_app.ui.screens.CartScreen
import com.pizzastore.android_app.ui.screens.CheckoutScreen
import com.pizzastore.android_app.ui.theme.AndroidappTheme
import com.pizzastore.android_app.utils.TokenManager
import com.pizzastore.android_app.viewmodel.HomeViewModel
import com.pizzastore.android_app.viewmodel.HomeViewModelFactory
import com.pizzastore.android_app.viewmodel.LoginViewModel
import com.pizzastore.android_app.viewmodel.LoginViewModelFactory
import com.pizzastore.android_app.viewmodel.ProductDetailViewModel
import com.pizzastore.android_app.viewmodel.ProductDetailViewModelFactory
import com.pizzastore.android_app.viewmodel.CartViewModel
import com.pizzastore.android_app.viewmodel.CartViewModelFactory
import com.pizzastore.android_app.viewmodel.CheckoutViewModel
import com.pizzastore.android_app.viewmodel.CheckoutViewModelFactory


class MainActivity : ComponentActivity() {

    // Simple manual DI for Phase 6 setup
    private lateinit var tokenManager: TokenManager
    private lateinit var authRepository: AuthRepository
    private lateinit var productRepository: ProductRepository
    private lateinit var cartRepository: CartRepository
    private lateinit var orderRepository: OrderRepository
    
    private val loginViewModel: LoginViewModel by viewModels {
        LoginViewModelFactory(authRepository)
    }
    
    private val homeViewModel: HomeViewModel by viewModels {
        HomeViewModelFactory(productRepository)
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

        enableEdgeToEdge()
        setContent {
            AndroidappTheme {
                AppNavigation(
                    loginViewModel = loginViewModel,
                    homeViewModel = homeViewModel,
                    productRepository = productRepository,
                    cartRepository = cartRepository,
                    orderRepository = orderRepository,
                    tokenManager = tokenManager,
                    initialRoute = if (tokenManager.getToken() != null) "home" else "login"
                )
            }
        }
    }
}

@Composable
fun AppNavigation(
    loginViewModel: LoginViewModel,
    homeViewModel: HomeViewModel,
    productRepository: ProductRepository,
    cartRepository: CartRepository,
    orderRepository: OrderRepository,
    tokenManager: TokenManager,
    initialRoute: String
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    val bottomBarRoutes = listOf("home", "cart", "profile")
    val showBottomBar = currentRoute in bottomBarRoutes

    LaunchedEffect(Unit) {
        tokenManager.sessionExpired.collect {
            navController.navigate("login") {
                popUpTo(0) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface,
                    tonalElevation = 8.dp
                ) {
                    val items = listOf(
                        Triple("home", Icons.Default.Home, "Trang chủ"),
                        Triple("cart", Icons.Default.ShoppingCart, "Giỏ hàng"),
                        Triple("profile", Icons.Default.Person, "Tài khoản")
                    )
                    
                    items.forEach { (route, icon, label) ->
                        NavigationBarItem(
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label) },
                            selected = currentRoute == route,
                            onClick = {
                                if (currentRoute != route) {
                                    navController.navigate(route) {
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = androidx.compose.material3.MaterialTheme.colorScheme.primary,
                                unselectedIconColor = androidx.compose.ui.graphics.Color.Gray,
                                indicatorColor = androidx.compose.material3.MaterialTheme.colorScheme.surface
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = initialRoute,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("login") {
                LoginScreen(
                    viewModel = loginViewModel,
                    onLoginSuccess = {
                        navController.navigate("home") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                )
            }
            composable("home") {
                HomeScreen(
                    viewModel = homeViewModel,
                    onProductClick = { productId ->
                        navController.navigate("detail/$productId")
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
                    factory = CartViewModelFactory(cartRepository, orderRepository)
                )
                CartScreen(
                    viewModel = cartViewModel,
                    onCheckoutClick = {
                        val voucherCode = cartViewModel.voucherCode.value
                        navController.currentBackStackEntry?.savedStateHandle?.set("voucherCode", voucherCode)
                        navController.navigate("checkout")
                    }
                )
            }
            composable("checkout") {
                val voucherCode = navController.previousBackStackEntry?.savedStateHandle?.get<String>("voucherCode")
                val checkoutViewModel: CheckoutViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
                    factory = CheckoutViewModelFactory(orderRepository)
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
                // To be implemented in Phase 6 updates
            }
        }
    }
}