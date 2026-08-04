import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import bannersAPI from '../../../api/bannersAPI';
import uploadAPI from '../../../api/uploadAPI';

const BannerForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    display_order: 0
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchBanner = async () => {
        try {
          const res = await bannersAPI.getAdminBanners();
          const banners = Array.isArray(res) ? res : res?.data || [];
          const banner = banners.find(b => b.id === parseInt(id));
          if (banner) {
            setFormData({
              title: banner.title || '',
              description: banner.description || '',
              image_url: banner.image_url || '',
              link_url: banner.link_url || '',
              is_active: banner.is_active,
              display_order: banner.display_order || 0
            });
            if (banner.image_url) {
              setPreviewImage(banner.image_url.startsWith('http') ? banner.image_url : `http://localhost:8000${banner.image_url}`);
            }
          } else {
            setError('Không tìm thấy banner');
          }
        } catch (err) {
          setError('Lỗi khi tải dữ liệu banner');
        } finally {
          setLoading(false);
        }
      };
      fetchBanner();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type and size (max 5MB)
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
        setFormData(prev => ({ ...prev, image_url: url }));
        setPreviewImage(url.startsWith('http') ? url : `http://localhost:8000${url}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Lỗi upload ảnh, vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
      // Reset input value to allow uploading same file again
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setPreviewImage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      setError('Vui lòng upload hình ảnh cho banner');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const payload = {
        ...formData,
        title: formData.title || null,
        description: formData.description || null,
        link_url: formData.link_url || null,
      };

      if (isEditMode) {
        await bannersAPI.updateBanner(id, payload);
      } else {
        await bannersAPI.createBanner(payload);
      }
      navigate('/admin/banners');
    } catch (err) {
      console.error('Submit error:', err);
      setError('Có lỗi xảy ra khi lưu banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/banners" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        
        {/* HÌNH ẢNH BANNER */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hình ảnh Banner <span className="text-red-500">*</span> (Tỉ lệ 16:9 hoặc 21:9)
          </label>
          
          {previewImage ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
              <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[300px] object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-lg"
                >
                  <Trash2 size={16} />
                  Xóa ảnh
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                {uploadingImage ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm">Đang tải ảnh lên...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-1 text-sm font-semibold">Nhấn để tải lên ảnh mới</p>
                    <p className="text-xs text-gray-400">PNG, JPG, JPEG (Max. 5MB)</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={uploadingImage}
              />
            </label>
          )}
        </div>

        {/* THÔNG TIN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề (Tùy chọn)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="VD: Siêu sale thứ 6, Mua 1 tặng 1..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả (Tùy chọn)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Mô tả ngắn gọn về chương trình..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Đường dẫn khi click (Tùy chọn)</label>
            <input
              type="text"
              name="link_url"
              value={formData.link_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="VD: /products/1 hoặc https://..."
            />
          </div>
          
          <div className="flex items-center gap-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="is_active" 
                checked={formData.is_active} 
                onChange={handleChange} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-semibold text-gray-700">Kích hoạt banner này</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Link
            to="/admin/banners"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>{saving ? 'Đang lưu...' : 'Lưu Banner'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Simple Trash icon fallback for BannerForm to avoid large imports if Trash2 is not imported properly
const Trash2 = ({ size = 24, color = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default BannerForm;
