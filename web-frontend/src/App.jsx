import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import ChatbotWidget from './components/common/ChatbotWidget';
import Home from './pages/shop/Home';
import Cart from './pages/shop/Cart';
import Checkout from './pages/shop/Checkout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/customer/Profile';
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import ProductsManagement from './pages/admin/ProductsManagement';
import CatalogManagement from './pages/admin/CatalogManagement';
import VouchersManagement from './pages/admin/VouchersManagement';
import OrderHistory from './pages/customer/OrderHistory';
import OrdersManagement from './pages/admin/OrdersManagement';
import AdminOrderHistory from './pages/admin/AdminOrderHistory';
import BannerList from './pages/admin/banners/BannerList';
import CustomersManagement from './pages/admin/CustomersManagement';
import ReviewsManagement from './pages/admin/ReviewsManagement';
import Footer from './components/common/Footer';

const CustomerLayout = () => (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
        {/* Global Navigation */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-grow w-full relative">
            <Outlet />
            <ChatbotWidget />
        </main>

        {/* Footer */}
        <Footer />
    </div>
);

function App() {
    return (
        <Routes>
            {/* Customer Area Routes */}
            <Route element={<CustomerLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/address-book" element={<Profile />} />
                <Route path="/orders" element={<OrderHistory />} />
            </Route>

            {/* Protected Admin Area Routes */}
            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="products" element={<ProductsManagement />} />
                <Route path="catalog" element={<CatalogManagement />} />
                <Route path="orders" element={<OrdersManagement />} />
                <Route path="orders-history" element={<AdminOrderHistory />} />
                <Route path="vouchers" element={<VouchersManagement />} />
                <Route path="banners" element={<BannerList />} />
                <Route path="reviews" element={<ReviewsManagement />} />
                <Route path="users" element={<CustomersManagement />} />
            </Route>

        </Routes>
    );
}

export default App;