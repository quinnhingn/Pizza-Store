import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (!formData.full_name || !formData.email || !formData.password || !formData.confirm_password) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const res = await register(formData);
    if (res.success) {
      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng sang trang đăng nhập...');
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: formData.email } });
      }, 1500);
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
              Khám phá thế giới ẩm thực Pizza hảo hạng!
            </h3>
            <p className="text-red-100 text-sm leading-relaxed mb-8">
              Chỉ mất 1 phút để tạo tài khoản và trải nghiệm dịch vụ đặt bánh thông nhanh chóng, tiện lợi.
            </p>

            {/* Perks List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <span className="text-2xl">✨</span>
                <div>
                  <h4 className="font-bold text-sm">Tặng ngay Voucher 50K</h4>
                  <p className="text-xs text-red-100/90">Áp dụng trực tiếp cho đơn hàng đầu tiên</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-bold text-sm">Đơn hàng thông minh chỉ 3 bước</h4>
                  <p className="text-xs text-red-100/90">Tùy chọn đế bánh, size & topping tự do</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="font-bold text-sm">Trợ lý AI hỗ trợ 24/7</h4>
                  <p className="text-xs text-red-100/90">Gợi ý combo ngon phù hợp khẩu vị của bạn</p>
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">Trở thành thành viên để nhận ngay ưu đãi từ Pizza Store</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn shadow-sm">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn shadow-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Họ và tên</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 shadow-sm"
                required
              />
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Từ 6 ký tự"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">Xác nhận MK</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Nhập lại pass"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm sm:text-base text-gray-800 placeholder-gray-400 shadow-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-3 sm:mt-5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <span>Đăng ký thành viên</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-600">
            Đã có tài khoản Pizza Store?{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700 underline transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;