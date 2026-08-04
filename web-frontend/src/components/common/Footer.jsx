import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-stone-900 text-gray-300 py-12 mt-16 border-t border-stone-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Cột 1: Thông tin thương hiệu */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 text-white">
              <span className="text-2xl">🍕</span>
              <span className="text-xl font-black tracking-tight">PizzaStore</span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Hương vị Pizza Ý đích thực với đế bánh thủ công và nguyên liệu tươi mới mỗi ngày. Chúng tôi cam kết mang đến trải nghiệm ẩm thực tuyệt vời nhất cho bạn.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-red-600 flex items-center justify-center transition-colors text-white">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.403 0 22.675 0z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-red-600 flex items-center justify-center transition-colors text-white">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-stone-800 hover:bg-red-600 flex items-center justify-center transition-colors text-white">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Về Chúng Tôi</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-red-500 transition-colors">Trang Chủ</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-red-500 transition-colors">Giỏ Hàng</Link>
              </li>
              <li>
                <a href="#" className="hover:text-red-500 transition-colors">Chính Sách Bảo Mật</a>
              </li>
              <li>
                <a href="#" className="hover:text-red-500 transition-colors">Điều Khoản Sử Dụng</a>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Liên Hệ</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                <span>123 Đường Pizza, Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-red-500 shrink-0" />
                <span>Hotline: 1900 1234 (Từ 9:00 - 22:00)</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-red-500 shrink-0" />
                <span>Email: contact@pizzastore.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between">
          <p>&copy; {new Date().getFullYear()} PizzaStore. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Thiết kế bởi PizzaStore Team</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
