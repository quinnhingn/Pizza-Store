import { useState, useEffect } from 'react';
import bannersAPI from '../../api/bannersAPI';
import uploadAPI from '../../api/uploadAPI';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

const BannerModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.image_url || '');
      setLinkUrl(initialData.link_url || '');
      setDisplayOrder(initialData.display_order || 0);
      setIsActive(initialData.is_active !== undefined ? initialData.is_active : true);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setLinkUrl('');
      setDisplayOrder(0);
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append('file', file);
      
      const response = await uploadAPI.uploadImage(data);
      const url = response.data?.url || response.url;
      
      if (url) {
        setImageUrl(url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Lỗi upload ảnh, vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      setError('Vui lòng tải lên hình ảnh hoặc nhập URL hình ảnh.');
      return;
    }

    setError(null);
    setLoading(true);

    const bannerData = {
      title,
      description,
      image_url: imageUrl,
      link_url: linkUrl,
      display_order: Number(displayOrder),
      is_active: isActive
    };

    try {
      if (initialData) {
        await bannersAPI.updateBanner(initialData.id, bannerData);
      } else {
        await bannersAPI.createBanner(bannerData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi lưu banner');
    } finally {
      setLoading(false);
    }
  };

  const displayImageUrl = imageUrl.startsWith('http') ? imageUrl : (imageUrl ? `http://localhost:8000${imageUrl}` : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-900 text-white">
          <h3 className="text-lg font-semibold">
            {initialData ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
          </h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-200">{isActive ? 'Đang hoạt động' : 'Đang ẩn'}</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
            <div className="w-px h-5 bg-gray-700"></div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề (Không bắt buộc)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề banner..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đường dẫn khi click (Không bắt buộc)
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="VD: /category/1..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
              />
            </div>


          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              disabled={loading}
            />
          </div>

          {/* Image Upload Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh Banner <span className="text-red-500">*</span></label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {displayImageUrl ? (
                <div className="relative w-48 h-24 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={displayImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-24 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50 flex-shrink-0">
                  <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                  <span className="text-[10px] mt-1">Chưa có ảnh</span>
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4" strokeWidth={1.75} />
                    <span>{uploadingImage ? 'Đang tải lên...' : 'Chọn file ảnh để tải lên'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={loading || uploadingImage}
                      className="hidden"
                    />
                  </label>
                  {uploadingImage && (
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL hình ảnh trực tiếp..."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  disabled={loading || uploadingImage}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{initialData ? 'Cập nhật' : 'Tạo mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerModal;
