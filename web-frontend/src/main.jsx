import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <WebSocketProvider>
                <NotificationProvider>
                    <CartProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </CartProvider>
                </NotificationProvider>
            </WebSocketProvider>
        </AuthProvider>
    </StrictMode>,
);