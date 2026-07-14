import { useState, useEffect } from 'react';
import userAPI from '../../api/userAPI';

const AddressBook = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    province: 'Hà Nội',
    district: '',
    ward: '',
    address_line: '',
    is_default: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAddresses();
      setAddresses(data);
    } catch (err) {
      setError('Không thể tải danh sách địa chỉ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showNotification = (text, isErr = false) => {
    if (isErr) setError(text);
    else setMsg(text);
    setTimeout(() => {
      setError('');
      setMsg('');
    }, 4000);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      full_name: '',
      phone: '',
      province: 'Hà Nội',
      district: '',
      ward: '',
      address_line: '',
      is_default: addresses.length === 0, // auto checked if no addresses yet
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setIsEditing(true);
    setCurrentId(addr.id);
    setFormData({
      full_name: addr.full_name,
      phone: addr.phone,
      province: addr.province || '',
      district: addr.district || '',
      ward: addr.ward || '',
      address_line: addr.address_line || '',
      is_default: addr.is_default,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.address_line || !formData.province) {
      showNotification('Vui lòng điền đủ các thông tin bắt buộc.', true);
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await userAPI.updateAddress(currentId, formData);
        showNotification('Cập nhật địa chỉ thành công!');
      } else {
        await userAPI.createAddress(formData);
        showNotification('Thêm địa chỉ mới thành công!');
      }
      setIsModalOpen(false);
      await fetchAddresses();
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await userAPI.deleteAddress(id);
      showNotification('Đã xóa địa chỉ thành công.');
      await fetchAddresses();
    } catch (err) {
      showNotification('Không thể xóa địa chỉ này.', true);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await userAPI.setDefaultAddress(id);
      showNotification('Đã đặt làm địa chỉ mặc định!');
      await fetchAddresses();
    } catch (err) {
      showNotification('Lỗi khi cập nhật địa chỉ mặc định.', true);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>📍 Sổ địa chỉ giao hàng</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Quản lý các địa chỉ nhận bánh của bạn để thanh toán nhanh chóng hơn
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      {/* Alerts */}
      {msg && (
        <div className="mt-5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{msg}</span>
        </div>
      )}
      {error && (
        <div className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Address List */}
      <div className="mt-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <svg className="animate-spin h-8 w-8 text-red-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Đang tải danh sách địa chỉ...</span>
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-14 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-gray-50/50">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🍕
            </div>
            <h3 className="font-bold text-gray-800 text-base sm:text-lg">Chưa có địa chỉ nào được lưu</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-1 mb-6">
              Bạn chưa có địa chỉ giao hàng nào. Hãy thêm ngay để thưởng thức pizza nóng hổi tận nhà nhé!
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
            >
              + Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  addr.is_default
                    ? 'border-2 border-red-500 bg-gradient-to-br from-red-50/40 to-orange-50/30 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm sm:text-base">{addr.full_name}</span>
                      <span className="text-gray-400 text-xs font-semibold">|</span>
                      <span className="text-gray-700 font-semibold text-xs sm:text-sm tracking-wide">{addr.phone}</span>
                    </div>
                    {addr.is_default && (
                      <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] sm:text-xs font-black rounded-full shadow-sm uppercase tracking-wider flex-shrink-0">
                        Mặc định
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-gray-600 space-y-1 bg-white/70 p-3 rounded-xl border border-gray-100/80 mb-4">
                    <p className="font-medium text-gray-800">{addr.address_line}</p>
                    <p className="text-gray-500">
                      {[addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs font-semibold">
                  <div>
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-red-600 hover:text-red-700 hover:underline transition-colors py-1"
                      >
                        Thiết lập mặc định
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-red-600 to-orange-600 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>{isEditing ? '✏️ Cập nhật địa chỉ' : '📍 Thêm địa chỉ mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tỉnh / Thành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="VD: Hà Nội"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="VD: Cầu Giấy"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    placeholder="VD: Dịch Vọng"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, đường) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address_line"
                  value={formData.address_line}
                  onChange={handleChange}
                  placeholder="VD: Số 123 đường Xuân Thủy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <span>Đặt làm địa chỉ mặc định</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isEditing ? 'Lưu thay đổi' : 'Thêm địa chỉ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressBook;
