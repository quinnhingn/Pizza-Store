import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import userAPI from '../../api/userAPI';
import AddressBook from './AddressBook';

const Profile = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL hash or default to 'info'
  const [activeTab, setActiveTab] = useState('info');
  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (location.hash === '#addresses') {
      setActiveTab('addresses');
    } else {
      setActiveTab('info');
    }
  }, [location.hash]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
    if (user) {
      setFullName(user.full_name || '');
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErr('Họ và tên không được để trống.');
      return;
    }
    try {
      setUpdating(true);
      setErr('');
      setMsg('');
      await userAPI.updateProfile({ full_name: fullName });
      setMsg('Cập nhật thông tin thành công! Tải lại trang để thấy thay đổi.');
    } catch (error) {
      setErr('Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-red-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600 font-medium">Đang tải hồ sơ cá nhân...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-red-50/50 via-orange-50/30 to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-red-600 font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg border-4 border-red-100 flex-shrink-0">
              {user.full_name?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user.full_name}</h1>
                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase border border-white/20">
                  {user.role}
                </span>
              </div>
              <p className="text-red-100 text-xs sm:text-sm mt-1">{user.email}</p>
              <p className="text-white/80 text-xs mt-3 bg-red-900/40 inline-block px-3 py-1 rounded-lg">
                🎉 Thành viên thân thiết tại Pizza Store
              </p>
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar Navigation + Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          {/* Sidebar Menu */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-3 flex flex-row md:flex-col gap-2 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('info');
                  navigate('/profile#info');
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left whitespace-nowrap md:whitespace-normal ${
                  activeTab === 'info'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">👤</span>
                <span>Thông tin tài khoản</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('addresses');
                  navigate('/profile#addresses');
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left whitespace-nowrap md:whitespace-normal ${
                  activeTab === 'addresses'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">📍</span>
                <span>Sổ địa chỉ</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            {activeTab === 'info' ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight pb-4 border-b border-gray-100 mb-6">
                  👤 Thông tin cá nhân
                </h2>

                {msg && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
                    <span>✅ {msg}</span>
                  </div>
                )}
                {err && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
                    <span>❌ {err}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Địa chỉ Email (Không thể thay đổi)</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs sm:text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                      Họ và tên hiển thị <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên mới"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-xs sm:text-sm transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Vai trò hệ thống</label>
                    <div className="px-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold capitalize">
                      {user.role}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={updating || fullName === user.full_name}
                      className="py-3 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updating ? 'Đang lưu thay đổi...' : 'Cập nhật thông tin'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <AddressBook />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
