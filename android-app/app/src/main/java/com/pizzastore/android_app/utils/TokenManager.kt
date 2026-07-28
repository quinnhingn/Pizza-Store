package com.pizzastore.android_app.utils

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class TokenManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_TOKEN_FILE, Context.MODE_PRIVATE)

    private val _sessionExpired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val sessionExpired = _sessionExpired.asSharedFlow()

    fun saveToken(token: String) {
        val editor = prefs.edit()
        editor.putString(USER_TOKEN, token)
        editor.apply()
    }

    fun getToken(): String? {
        return prefs.getString(USER_TOKEN, null)
    }

    fun clearToken() {
        val editor = prefs.edit()
        editor.remove(USER_TOKEN)
        editor.apply()
    }

    fun notifySessionExpired() {
        clearToken()
        _sessionExpired.tryEmit(Unit)
    }

    companion object {
        const val PREFS_TOKEN_FILE = "prefs_token_file"
        const val USER_TOKEN = "user_token"
    }
}
