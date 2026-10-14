package com.pizzastore.android_app.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import java.io.File
import java.security.GeneralSecurityException

class TokenManager(private val context: Context) {

    private var prefs: SharedPreferences = initEncryptedPrefs()

    private val _sessionExpired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val sessionExpired = _sessionExpired.asSharedFlow()

    private fun initEncryptedPrefs(): SharedPreferences {
        return try {
            createEncryptedSharedPreferences()
        } catch (e: Exception) {
            when (e) {
                is GeneralSecurityException, is SecurityException -> {
                    // Xóa file prefs bị hỏng do lỗi Keystore
                    deleteSharedPreferencesFile(PREFS_TOKEN_FILE)
                    createEncryptedSharedPreferences()
                }
                else -> throw e
            }
        }
    }

    private fun createEncryptedSharedPreferences(): SharedPreferences {
        val masterKey = MasterKey.Builder(context, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            context,
            PREFS_TOKEN_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private fun deleteSharedPreferencesFile(name: String) {
        val file = File(context.applicationInfo.dataDir, "shared_prefs/$name.xml")
        if (file.exists()) {
            file.delete()
        }
    }

    fun saveToken(token: String) {
        prefs.edit().putString(USER_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return prefs.getString(USER_TOKEN, null)
    }

    fun clearToken() {
        prefs.edit().remove(USER_TOKEN).apply()
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