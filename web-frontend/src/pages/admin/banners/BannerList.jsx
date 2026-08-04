import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import bannersAPI from '../../../api/bannersAPI';

const BannerList = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await bannersAPI.getAdminBanners();
      const data = Array.isArray(res) ? res : res?.data || [];
      // Sort by display_order to ensure correct UI ordering
      const sortedData = data.sort((a, b) => a.display_order - b.display_order);
      setBanners(sortedData);
    } catch (err) {
      console.error('Lỗi khi tải danh sách banner:', err);
      alert('Không thể tải banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleMove = async (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1)) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];
    
    const newBanners = [...banners];
    const tempOrder = currentBanner.display_order;
    newBanners[index] = { ...currentBanner, display_order: targetBanner.display_order };
    newBanners[targetIndex] = { ...targetBanner, display_order: tempOrder };
    
    newBanners.sort((a, b) => a.display_order - b.display_order);
    setBanners(newBanners);
    
    try {
      await Promise.all([
        bannersAPI.updateBanner(currentBanner.id, { display_order: targetBanner.display_order }),
        bannersAPI.updateBanner(targetBanner.id, { display_order: tempOrder })
      ]);
    } catch (err) {
      console.error('Lỗi khi đổi vị trí banner:', err);
      alert('Lỗi đổi vị trí, dữ liệu sẽ được tải lại.');
      fetchBanners();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    try {
      await bannersAPI.deleteBanner(id);
      setBanners(banners.filter(b => b.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa banner:', err);
      alert('Không thể xóa banner.');
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      const updatedBanner = await bannersAPI.updateBanner(banner.id, { is_active: !banner.is_active });
      const data = updatedBanner?.data || updatedBanner;
      setBanners(banners.map(b => b.id === banner.id ? data : b));
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Không thể cập nhật trạng thái.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Banner</h1>
        <Link
          to="/admin/banners/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Thêm Banner</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Hình ảnh</th>
                <th className="px-6 py-4 font-semibold">Tiêu đề</th>
                <th className="px-6 py-4 font-semibold">Thứ tự hiển thị</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Chưa có banner nào. Hãy thêm banner mới!
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-32 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        <img 
                          src={banner.image_url.startsWith('http') ? banner.image_url : `http://localhost:8000${banner.image_url}`} 
                          alt={banner.title || 'Banner'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{banner.title || '(Không có tiêu đề)'}</div>
                      {banner.description && <div className="text-sm text-gray-500 mt-1 line-clamp-1">{banner.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 w-4 text-center">{banner.display_order}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMove(banners.indexOf(banner), 'up')}
                            disabled={banners.indexOf(banner) === 0}
                            className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Di chuyển lên"
                          >
                            <ArrowUp size={14} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleMove(banners.indexOf(banner), 'down')}
                            disabled={banners.indexOf(banner) === banners.length - 1}
                            className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          banner.is_active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {banner.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {banner.is_active ? 'Đang hiện' : 'Đang ẩn'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/admin/banners/${banner.id}/edit`}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BannerList;
