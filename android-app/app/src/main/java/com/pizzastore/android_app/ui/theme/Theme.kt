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
    primary = Red600,
    onPrimary = White,
    primaryContainer = Red700,
    onPrimaryContainer = White,
    secondary = Orange600,
    onSecondary = White,
    tertiary = Green500,
    onTertiary = White,
    background = Slate800,
    onBackground = Slate50,
    surface = Slate800,
    onSurface = Slate50,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate200,
    outline = Slate500
)

private val LightColorScheme = lightColorScheme(
    primary = Red600,
    onPrimary = White,
    primaryContainer = Red100,
    onPrimaryContainer = Red700,
    secondary = Orange600,
    onSecondary = White,
    tertiary = Green500,
    onTertiary = White,
    background = Slate100,
    onBackground = Slate800,
    surface = White,
    onSurface = Slate800,
    surfaceVariant = White,
    onSurfaceVariant = Slate500,
    surfaceTint = White,
    outline = Slate200
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