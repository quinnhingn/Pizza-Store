import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 text-xl sm:text-2xl font-black tracking-tight hover:opacity-90 transition-opacity text-white">
            <span className="text-2xl sm:text-3xl drop-shadow-md">🍕</span>
            <span className="drop-shadow-sm">PizzaStore</span>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell (Only for logged-in user) */}
            {isAuthenticated && user && (
              <NotificationDropdown isAdmin={false} isDarkBg={true} />
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              title="Giỏ hàng của bạn"
              className="relative p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full border border-white/20 text-white flex items-center justify-center backdrop-blur-sm shadow-sm"
            >
              <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-red-600 text-[10px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Dropdown Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1.5 pl-3 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full border border-white/20 shadow-sm backdrop-blur-sm"
                title="Tài khoản & Điều hướng"
              >
                {/* Hamburger icon */}
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {/* User avatar icon */}
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu Box */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-150 text-gray-800 py-2 z-50 animate-fade-in text-sm font-medium">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
                        <div className="text-xs text-gray-500 font-normal">Đăng nhập là</div>
                        <div className="font-bold text-gray-900 truncate">{user.full_name}</div>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black bg-yellow-400 text-gray-900 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2.5 text-red-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                          Quản trị Admin
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        Sổ địa chỉ & Tài khoản
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        Theo dõi đơn hàng
                      </Link>

                      <hr className="my-1 border-gray-100" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 font-semibold transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        Đăng nhập
                      </Link>

                      <Link
                        to="/register"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        Đăng ký
                      </Link>

                      <hr className="my-1 border-gray-100" />

                      <Link
                        to="/orders"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        Theo dõi đơn hàng
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;