import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-red-600 via-red-650 to-red-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 text-xl sm:text-2xl font-black tracking-tight hover:opacity-95 transition-opacity">
          <span className="text-2xl sm:text-3xl">🍕</span>
          <span>Pizza Store</span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Nút Giỏ hàng */}
          <Link
            to="/cart"
            title="Giỏ hàng của bạn"
            className="relative p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl border border-white/20 text-white shadow-sm flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-red-900 text-[10px] sm:text-xs font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/profile"
                title="Quản lý tài khoản & Sổ địa chỉ"
                className="flex items-center gap-1.5 sm:gap-2 bg-red-800/60 hover:bg-red-800/90 transition-all px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-red-500/30 text-xs sm:text-sm cursor-pointer shadow-sm hover:shadow"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"></span>
                <span className="font-medium text-gray-100 truncate max-w-[120px] sm:max-w-none">
                  Xin chào, <strong className="text-white underline decoration-white/50 underline-offset-2">{user.full_name}</strong>
                </span>
                {user.role === 'admin' && (
                  <span className="ml-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-yellow-400 text-gray-900 rounded-full shadow-sm flex-shrink-0">
                    Admin
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold transition-all border border-white/20 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm shadow-sm"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Đăng xuất</span>
                <span className="sm:hidden">Thoát</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="hover:text-gray-200 transition-colors font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-red-800/30 text-xs sm:text-sm"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-white text-red-600 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl font-bold hover:bg-orange-50 active:scale-95 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;