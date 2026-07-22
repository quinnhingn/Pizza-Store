import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Sliders,
  ShoppingBag,
  Ticket,
  Users,
  Utensils,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import NotificationDropdown from '../components/common/NotificationDropdown';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State to manage open collapsible menu groups
  const [openGroups, setOpenGroups] = useState({
    menu_catalog_group: true // Default open
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { name: 'Dashboard Thống kê', path: '/admin', icon: LayoutDashboard, exact: true }
      ]
    },
    {
      title: 'BÁN HÀNG & GIAO VẬN',
      items: [
        { name: 'Đơn đặt hàng (Orders)', path: '/admin/orders', icon: ShoppingBag },
        { name: 'Khách hàng & Thành viên', path: '/admin/users', icon: Users },
        { name: 'Khuyến mãi & Voucher', path: '/admin/vouchers', icon: Ticket },
      ]
    },
    {
      title: 'THỰC ĐƠN & HỆ THỐNG',
      items: [
        {
          name: 'Quản lý thực đơn',
          id: 'menu_catalog_group',
          icon: Utensils,
          children: [
            { name: 'Danh mục món', path: '/admin/categories', icon: FolderTree },
            { name: 'Quản lý món', path: '/admin/products', icon: Package },
          ]
        },
        { name: 'Cấu hình thuộc tính', path: '/admin/catalog', icon: Sliders },
      ]
    }
  ];

  // Auto-expand group if current route matches any child item
  useEffect(() => {
    menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const isChildActive = item.children.some(child => location.pathname === child.path);
          if (isChildActive) {
            setOpenGroups(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-30 shadow-2xs">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/admin" className="text-base font-semibold tracking-tight text-gray-900 flex items-center gap-1.5">
            <span>Pizza Store</span>
            <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-900 text-white rounded-md font-medium">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                {section.title}
              </div>

              {section.items.map((item) => {
                const IconComponent = item.icon;

                // Handle expandable dropdown item
                if (item.children) {
                  const isAnyChildActive = item.children.some(child => location.pathname === child.path);
                  const isOpen = openGroups[item.id];

                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          isAnyChildActive
                            ? 'text-gray-900 bg-gray-100/80 font-semibold'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                          <span>{item.name}</span>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-150" strokeWidth={2} />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-150" strokeWidth={2} />
                        )}
                      </button>

                      {/* Dropdown Children */}
                      {isOpen && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-gray-200 ml-5">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive }) =>
                                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    isActive
                                      ? 'bg-gray-900 text-white shadow-2xs font-semibold'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`
                                }
                              >
                                <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                                <span>{child.name}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Handle standard link item
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-2xs font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 font-mono">Pizza Store v2.0 - Hierarchical UI</div>
        </div>
      </aside>

      {/* Main Area with Topbar */}
      <div className="flex-1 flex flex-col pl-64">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-8 shadow-2xs">
          <div>
            <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Cổng Quản Trị Hệ Thống</h1>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Về trang Khách hàng
            </Link>

            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <NotificationDropdown isAdmin={true} />
              <span className="text-gray-700 font-medium ml-1">
                {user?.full_name || user?.email || 'Quản trị viên'}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
