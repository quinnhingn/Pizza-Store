import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.registeredEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.registeredEmail }));
      setInfoMsg('Tài khoản đã được tạo! Vui lòng nhập mật khẩu để đăng nhập.');
    }
    if (isAuthenticated) {
      navigate('/');
    }
  }, [location.state, isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setInfoMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    const res = await login(formData.email, formData.password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-red-50/80 via-orange-50/50 to-amber-50/80 p-4 sm:p-6 lg:p-8">
      {/* Responsive Container: Stacked on Mobile/Tablet, Split Grid on Large Desktop */}
      <div className="w-full max-w-md lg:max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-xl lg:shadow-2xl border border-gray-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all duration-300">

        {/* Left / Top Banner (Desktop Hero Perks & Branding) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-red-600 via-red-700 to-orange-600 p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Decorative Background Circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-12">
              <span className="text-3xl">🍕</span>
              <span className="text-2xl font-black tracking-tight">Pizza Store</span>
            </Link>

            <h3 className="text-3xl font-extrabold leading-tight tracking-tight mb-4">
              Thưởng thức hương vị Ý đích thực ngay tại nhà!
            </h3>
            <p className="text-red-100 text-sm leading-relaxed mb-8">
              Đăng nhập ngay để nhận các ưu đãi đặc quyền dành riêng cho thành viên Pizza Store.
            </p>

            {/* Perks List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <span className="text-2xl">🔥</span>
                <div>
                  <h4 className="font-bold text-sm">Giao nóng hổi trong 30 phút</h4>
                  <p className="text-xs text-red-100/90">Cam kết hoàn tiền nếu bánh bị nguội</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <span className="text-2xl">🎁</span>
                <div>
                  <h4 className="font-bold text-sm">Tích điểm đổi quà hấp dẫn</h4>
                  <p className="text-xs text-red-100/90">Mỗi đơn hàng đều được cộng điểm thành viên</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <span className="text-2xl">🏷️</span>
                <div>
                  <h4 className="font-bold text-sm">Voucher độc quyền cực sốc</h4>
                  <p className="text-xs text-red-100/90">Giảm đến 50% cho ngày sinh nhật & lễ tết</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer inside banner */}
          <div className="relative z-10 pt-8 border-t border-white/15 text-xs text-red-200/80">
            © 2026 Pizza Store. All rights reserved.
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center bg-white">
          {/* Mobile Only Header Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
            <span className="text-3xl">🍕</span>
            <span className="text-2xl font-black text-red-600 tracking-tight">Pizza Store</span>
          </div>

          {/* Form Title & Description */}
          <div className="text-center lg:text-left mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Đăng nhập tài khoản</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">Chào mừng bạn trở lại! Vui lòng nhập thông tin để tiếp tục.</p>
          </div>

          {/* Info Alert (from Register redirect) */}
          {infoMsg && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn shadow-sm">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn shadow-sm">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Địa chỉ Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 shadow-sm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">Mật khẩu</label>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 shadow-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-3 sm:mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Đăng nhập ngay</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-600">
            Chưa có tài khoản tại Pizza Store?{' '}
            <Link to="/register" className="font-bold text-red-600 hover:text-red-700 underline transition-colors">
              Đăng ký thành viên mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;