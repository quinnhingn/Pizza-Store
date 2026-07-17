import { useState, useEffect } from 'react';
import sizesToppingsAPI from '../../api/sizesToppingsAPI';
import { X } from 'lucide-react';

const ToppingModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [name, setName] = useState('');
  const [defaultExtraPrice, setDefaultExtraPrice] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDefaultExtraPrice(initialData.default_extra_price ? String(initialData.default_extra_price) : '0');
    } else {
      setName('');
      setDefaultExtraPrice('0');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên món thêm (Topping) không được để trống');
      return;
    }

    const extra = parseFloat(defaultExtraPrice);
    if (isNaN(extra) || extra < 0) {
      setError('Giá cộng thêm phải là số lớn hơn hoặc bằng 0');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      default_extra_price: extra
    };

    try {
      if (initialData?.id) {
        await sizesToppingsAPI.updateTopping(initialData.id, payload);
      } else {
        await sizesToppingsAPI.createTopping(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi lưu món thêm';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {initialData ? 'Sửa món thêm (Topping) chuẩn' : 'Thêm món thêm (Topping) chuẩn mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên món thêm (Topping) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thêm phô mai Mozzarella, Viền xúc xích..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá cộng thêm VNĐ (mặc định)
            </label>
            <input
              type="number"
              step="1000"
              min="0"
              value={defaultExtraPrice}
              onChange={(e) => setDefaultExtraPrice(e.target.value)}
              placeholder="Ví dụ: 20000, 35000..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Số tiền cộng thêm mặc định khi khách chọn topping này.
            </p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            Lưu ý: Mức giá mẫu này sẽ tự động điền khi Admin chọn topping cho món ăn. Bạn vẫn có thể tùy chỉnh lại mức giá riêng cho từng món trên form thêm/sửa sản phẩm.
          </p>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
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

export default ToppingModal;
