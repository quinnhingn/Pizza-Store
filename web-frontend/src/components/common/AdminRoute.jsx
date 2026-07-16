import { Navigate, Outlet, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-600">Đang xác thực quyền Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Từ chối truy cập (403)</h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Khu vực này dành riêng cho quản trị viên hệ thống. Tài khoản của bạn (<span className="font-medium text-gray-800">{user.email}</span>) không có quyền truy cập vào trang này.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Quay lại Trang chủ
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đổi tài khoản Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children || <Outlet />;
};

export default AdminRoute;
