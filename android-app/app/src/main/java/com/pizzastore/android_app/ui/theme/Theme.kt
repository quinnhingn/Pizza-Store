package com.pizzastore.android_app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = PizzaRed,
    secondary = PizzaOrange,
    tertiary = PizzaGreen,
    background = PizzaDark,
    surface = PizzaDark,
    onPrimary = PizzaSurface,
    onSecondary = PizzaDark,
    onTertiary = PizzaSurface,
    onBackground = PizzaSurface,
    onSurface = PizzaSurface
)

private val LightColorScheme = lightColorScheme(
    primary = PizzaRed,
    secondary = PizzaOrange,
    tertiary = PizzaGreen,
    background = PizzaBackground,
    surface = PizzaSurface,
    onPrimary = PizzaSurface,
    onSecondary = PizzaSurface,
    onTertiary = PizzaSurface,
    onBackground = PizzaDark,
    onSurface = PizzaDark
)

@Composable
fun AndroidappTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}