import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Home from './pages/shop/Home';
import Cart from './pages/shop/Cart';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/customer/Profile';
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import ProductsManagement from './pages/admin/ProductsManagement';
import CatalogManagement from './pages/admin/CatalogManagement';
import VouchersManagement from './pages/admin/VouchersManagement';

const CustomerLayout = () => (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
        {/* Global Navigation */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-grow w-full">
            <Outlet />
        </main>
    </div>
);

function App() {
    return (
        <Routes>
            {/* Customer Area Routes */}
            <Route element={<CustomerLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/address-book" element={<Profile />} />
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
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="products" element={<ProductsManagement />} />
                <Route path="catalog" element={<CatalogManagement />} />
                <Route path="orders" element={<div className="bg-white p-6 rounded-xl border border-gray-200 text-sm text-gray-600">Trang quản lý Đơn hàng</div>} />
                <Route path="vouchers" element={<VouchersManagement />} />
                <Route path="users" element={<div className="bg-white p-6 rounded-xl border border-gray-200 text-sm text-gray-600">Trang quản lý Khách hàng</div>} />
            </Route>
        </Routes>
    );
}

export default App;