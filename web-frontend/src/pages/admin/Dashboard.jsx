import useAuth from '../../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Danh mục sản phẩm', value: '--', sub: 'Sẵn sàng tích hợp API (Ngày 8)' },
    { label: 'Sản phẩm đang bán', value: '--', sub: 'Sẵn sàng tích hợp API (Ngày 9)' },
    { label: 'Đơn hàng hôm nay', value: '--', sub: 'Đang chờ xử lý' },
    { label: 'Khách hàng thành viên', value: '--', sub: 'Tổng người dùng active' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          Xin chào <span className="font-medium text-gray-900">{user?.full_name || 'Quản trị viên'}</span>, chào mừng quay trở lại hệ thống quản lý Pizza Store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-2">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-medium text-gray-900">Trạng thái triển khai</h3>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          Hệ thống bảo vệ đường dẫn (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">AdminRoute</code>) và cấu trúc giao diện quản trị (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">AdminLayout</code>) đã hoàn thành kết nối trong Ngày 7. Các chức năng Quản lý Danh mục và Quản lý Sản phẩm sẽ được tích hợp nối tiếp vào các route tương ứng.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
