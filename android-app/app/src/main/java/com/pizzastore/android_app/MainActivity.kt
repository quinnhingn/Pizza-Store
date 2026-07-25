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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.pizzastore.android_app.network.AuthApiService
import com.pizzastore.android_app.network.NetworkModule
import com.pizzastore.android_app.network.ProductApiService
import com.pizzastore.android_app.repository.AuthRepository
import com.pizzastore.android_app.repository.ProductRepository
import com.pizzastore.android_app.ui.screens.HomeScreen
import com.pizzastore.android_app.ui.screens.LoginScreen
import com.pizzastore.android_app.ui.theme.AndroidappTheme
import com.pizzastore.android_app.utils.TokenManager
import com.pizzastore.android_app.viewmodel.HomeViewModel
import com.pizzastore.android_app.viewmodel.HomeViewModelFactory
import com.pizzastore.android_app.viewmodel.LoginViewModel
import com.pizzastore.android_app.viewmodel.LoginViewModelFactory

class MainActivity : ComponentActivity() {

    // Simple manual DI for Phase 6 setup
    private lateinit var tokenManager: TokenManager
    private lateinit var authRepository: AuthRepository
    private lateinit var productRepository: ProductRepository
    
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

        enableEdgeToEdge()
        setContent {
            AndroidappTheme {
                AppNavigation(
                    loginViewModel = loginViewModel,
                    homeViewModel = homeViewModel,
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
    initialRoute: String
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    val bottomBarRoutes = listOf("home", "cart", "profile")
    val showBottomBar = currentRoute in bottomBarRoutes

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
                        // To be implemented in Day 25: navigate to detail screen
                    }
                )
            }
            composable("cart") {
                // To be implemented in Day 26
            }
            composable("profile") {
                // To be implemented in Phase 6 updates
            }
        }
    }
}