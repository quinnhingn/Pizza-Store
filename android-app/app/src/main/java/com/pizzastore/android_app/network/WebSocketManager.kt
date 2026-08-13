package com.pizzastore.android_app.network

import com.pizzastore.android_app.utils.TokenManager
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject

class WebSocketManager(
    private val client: OkHttpClient,
    private val tokenManager: TokenManager
) {
    private var webSocket: WebSocket? = null
    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 10)
    val events: SharedFlow<String> = _events.asSharedFlow()

    fun connect() {
        if (webSocket != null) return // Already connected

        val token = tokenManager.getToken() ?: return
        val request = Request.Builder()
            // Using the alias for localhost on Android emulator
            .url("ws://10.0.2.2:8000/api/ws?token=$token")
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                println("WebSocket Connected")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                println("WebSocket Message: $text")
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type")
                    if (type == "order_update" || type == "new_order" || type == "notification" || type == "voucher_gift") {
                        _events.tryEmit(type)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                println("WebSocket Closed: $reason")
                this@WebSocketManager.webSocket = null
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                println("WebSocket Failure: ${t.message}")
                this@WebSocketManager.webSocket = null
            }
        })
    }

    fun disconnect() {
        webSocket?.close(1000, "User logout or disconnect")
        webSocket = null
    }
}
