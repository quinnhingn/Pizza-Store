import React, { useState, useEffect, Fragment } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import bannersAPI from '../../../api/bannersAPI';
import BannerModal from '../../../components/admin/BannerModal';
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal';

const BannerList = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await bannersAPI.getAdminBanners();
      const data = Array.isArray(res) ? res : res?.data || [];
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

  const handleOpenAdd = () => {
    setCurrentBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setCurrentBanner(banner);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (banner) => {
    setBannerToDelete(banner);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    try {
      await bannersAPI.deleteBanner(bannerToDelete.id);
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
      await fetchBanners();
    } catch (err) {
      console.error('Lỗi khi xóa banner:', err);
      alert('Không thể xóa banner này.');
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1)) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const banner = banners[index];
    const targetBanner = banners[targetIndex];

    const newBanners = [...banners];
    const tempOrder = banner.display_order;
    newBanners[index] = { ...banner, display_order: targetBanner.display_order };
    newBanners[targetIndex] = { ...targetBanner, display_order: tempOrder };

    newBanners.sort((a, b) => a.display_order - b.display_order);
    setBanners(newBanners);

    try {
      await Promise.all([
        bannersAPI.updateBanner(banner.id, { display_order: targetBanner.display_order }),
        bannersAPI.updateBanner(targetBanner.id, { display_order: tempOrder })
      ]);
    } catch (err) {
      console.error('Lỗi khi đổi vị trí banner:', err);
      alert('Lỗi đổi vị trí, dữ liệu sẽ được tải lại.');
      fetchBanners();
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Banner</h2>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Thêm Banner</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Hình ảnh</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiêu đề / Mô tả</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Thứ tự</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải banner...</span>
                    </div>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                    <span>Chưa có banner nào. Hãy thêm banner mới!</span>
                  </td>
                </tr>
              ) : (
                banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="w-32 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shadow-2xs">
                        {banner.image_url ? (
                          <img
                            src={banner.image_url.startsWith('http') ? banner.image_url : `http://localhost:8000${banner.image_url}`}
                            alt={banner.title || 'Banner'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-gray-900">{banner.title || '(Không có tiêu đề)'}</div>
                      {banner.description && <div className="text-[13px] text-gray-500 mt-0.5 line-clamp-1">{banner.description}</div>}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-semibold text-gray-800 w-4">{banner.display_order}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp size={14} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === banners.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <label className="inline-flex items-center gap-2 cursor-pointer justify-center" onClick={(e) => { e.preventDefault(); handleToggleStatus(banner); }}>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={banner.is_active}
                            readOnly
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                        <span className={`text-xs font-medium ${banner.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {banner.is_active ? 'Đang hoạt động' : 'Đang ẩn'}
                        </span>
                      </label>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(banner)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa banner"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
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

      <BannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchBanners();
        }}
        initialData={currentBanner}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa Banner"
        message={`Bạn có chắc chắn muốn xóa banner "${bannerToDelete?.title || 'này'}" không? Thao tác này không thể hoàn tác.`}
        isDeleting={deleting}
      />
    </div>
  );
};

export default BannerList;
