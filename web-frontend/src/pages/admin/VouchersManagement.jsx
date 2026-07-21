import { useState, useEffect } from 'react';
import vouchersAPI from '../../api/vouchersAPI';
import userAPI from '../../api/userAPI';

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'amount', // 'amount' or 'percent'
    discount_value: '',
    max_discount: '',
    min_order_value: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    is_active: true
  });

  // Gift modal states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftingVoucher, setGiftingVoucher] = useState(null);
  const [giftForm, setGiftForm] = useState({
    send_to_all: false,
    selected_users: [],
    custom_message: '',
    search_term: ''
  });
  const [giftingLoading, setGiftingLoading] = useState(false);

  useEffect(() => {
    fetchVouchers();
    fetchCustomers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await vouchersAPI.getAdminVouchers();
      setVouchers(Array.isArray(res) ? res : (res.data || []));
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách voucher. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await userAPI.getAdminCustomers();
      setCustomers(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleOpenAddForm = () => {
    setEditingVoucher(null);
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);

    setFormData({
      code: '',
      discount_type: 'amount',
      discount_value: '',
      max_discount: '',
      min_order_value: '100000',
      start_date: now.toISOString().slice(0, 16),
      end_date: nextYear.toISOString().slice(0, 16),
      usage_limit: '1000',
      is_active: true
    });
    setShowFormModal(true);
  };

  const handleOpenEditForm = (v) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      discount_type: v.discount_percent ? 'percent' : 'amount',
      discount_value: v.discount_percent || v.discount_amount || '',
      max_discount: v.max_discount || '',
      min_order_value: v.min_order_value || '',
      start_date: v.start_date ? new Date(v.start_date).toISOString().slice(0, 16) : '',
      end_date: v.end_date ? new Date(v.end_date).toISOString().slice(0, 16) : '',
      usage_limit: v.usage_limit || '',
      is_active: v.is_active
    });
    setShowFormModal(true);
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : new Date().toISOString(),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
        is_active: formData.is_active
      };

      if (formData.discount_type === 'percent') {
        payload.discount_percent = parseInt(formData.discount_value, 10);
        payload.discount_amount = null;
        payload.max_discount = formData.max_discount ? parseFloat(formData.max_discount) : null;
      } else {
        payload.discount_amount = parseFloat(formData.discount_value);
        payload.discount_percent = null;
        payload.max_discount = null;
      }

      if (editingVoucher) {
        await vouchersAPI.updateVoucher(editingVoucher.id, payload);
      } else {
        await vouchersAPI.createVoucher(payload);
      }

      setShowFormModal(false);
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Có lỗi xảy ra khi lưu voucher.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await vouchersAPI.toggleVoucherStatus(id);
      fetchVouchers();
    } catch (err) {
      alert('Không thể thay đổi trạng thái.');
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mã voucher "${v.code}"?`)) return;
    try {
      const res = await vouchersAPI.deleteVoucher(v.id);
      alert(res?.message || res?.data?.message || 'Đã xóa voucher thành công.');
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Không thể xóa voucher.');
    }
  };

  const handleOpenGiftModal = (v) => {
    setGiftingVoucher(v);
    setGiftForm({
      send_to_all: false,
      selected_users: [],
      custom_message: `Pizza Store gửi tặng bạn mã giảm giá đặc biệt ${v.code}. Nhấn nút Lưu ngay bên dưới để áp dụng cho đơn hàng tiếp theo nhé!`,
      search_term: ''
    });
    setShowGiftModal(true);
  };

  const handleToggleSelectUser = (userId) => {
    setGiftForm((prev) => {
      const exists = prev.selected_users.includes(userId);
      return {
        ...prev,
        selected_users: exists
          ? prev.selected_users.filter((id) => id !== userId)
          : [...prev.selected_users, userId]
      };
    });
  };

  const handleSendGift = async (e) => {
    e.preventDefault();
    if (!giftingVoucher) return;
    if (!giftForm.send_to_all && giftForm.selected_users.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khách hàng hoặc chọn gửi cho tất cả khách hàng.');
      return;
    }

    try {
      setGiftingLoading(true);
      const res = await vouchersAPI.giftVoucher(giftingVoucher.id, {
        send_to_all: giftForm.send_to_all,
        user_ids: giftForm.selected_users,
        custom_message: giftForm.custom_message
      });
      alert(res?.message || res?.data?.message || 'Đã gửi tặng mã thành công!');
      setShowGiftModal(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Có lỗi khi gửi tặng voucher.');
    } finally {
      setGiftingLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!giftForm.search_term) return true;
    const q = giftForm.search_term.toLowerCase();
    return (
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Khuyến mãi & Voucher</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập mã giảm giá, theo dõi tiến độ sử dụng và gửi tặng ưu đãi tới khách hàng.
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center"
        >
          Thêm voucher mới
        </button>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
          Đang tải danh sách voucher...
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
          Chưa có mã voucher nào. Hãy bấm "Thêm voucher mới" để tạo.
        </div>
      ) : (
        /* Vouchers Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Voucher</th>
                  <th className="py-3.5 px-4">Mức giảm giá</th>
                  <th className="py-3.5 px-4">Đơn tối thiểu</th>
                  <th className="py-3.5 px-4">Thời hạn</th>
                  <th className="py-3.5 px-4">Tiến độ sử dụng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {vouchers.map((v) => {
                  const isExpired = new Date() > new Date(v.end_date);
                  const isLimitReached = v.usage_limit !== null && v.used_count >= v.usage_limit;
                  const progressPct = v.usage_limit ? Math.min(100, Math.round((v.used_count / v.usage_limit) * 100)) : 0;

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-4 font-black text-gray-900 tracking-wide">
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-100">
                          {v.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-800">
                        {v.discount_percent ? (
                          <div>
                            <span>Giảm {v.discount_percent}%</span>
                            {v.max_discount && (
                              <div className="text-xs text-gray-500 font-normal">
                                Tối đa {formatCurrency(v.max_discount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span>Giảm {formatCurrency(v.discount_amount)}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {v.min_order_value ? formatCurrency(v.min_order_value) : '0đ'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-xs">
                        <div>Từ: {formatDate(v.start_date)}</div>
                        <div>Đến: {formatDate(v.end_date)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                            <span>{v.used_count} đã dùng</span>
                            <span>{v.usage_limit ? `/${v.usage_limit}` : '∞'}</span>
                          </div>
                          {v.usage_limit && (
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {!v.is_active ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            Tạm ngưng
                          </span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                            Hết hạn
                          </span>
                        ) : isLimitReached ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Hết lượt
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.is_active && !isExpired && !isLimitReached && (
                            <button
                              onClick={() => handleOpenGiftModal(v)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                            >
                              Tặng quà
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditForm(v)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg text-xs transition-all"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleToggleStatus(v.id)}
                            className={`font-medium px-3 py-1.5 rounded-lg text-xs transition-all ${
                              v.is_active
                                ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200'
                                : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                            }`}
                          >
                            {v.is_active ? 'Khóa' : 'Mở khóa'}
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1.5 rounded-lg text-xs transition-all border border-red-200"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal Add/Edit */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-gray-900 mb-4">
              {editingVoucher ? `Chỉnh sửa voucher: ${editingVoucher.code}` : 'Thêm voucher khuyến mãi mới'}
            </h2>
            <form onSubmit={handleSaveVoucher} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mã Voucher</label>
                <input
                  type="text"
                  required
                  disabled={!!editingVoucher}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: PIZZA50, WELCOME..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-bold uppercase disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Loại giảm giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="amount">Số tiền cố định (VNĐ)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {formData.discount_type === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percent' ? '10 - 100' : '50000'}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {formData.discount_type === 'percent' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="VD: 50000 (Để trống nếu không giới hạn)"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Giá trị đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    placeholder="100000"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="1000 (Để trống nếu vô hạn)"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bắt đầu từ</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hết hạn lúc</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="chk_active" className="font-semibold text-gray-700 cursor-pointer">
                  Kích hoạt mã giảm giá ngay
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Voucher Modal */}
      {showGiftModal && giftingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-black text-gray-900 mb-1">
              Gửi tặng Voucher: <span className="text-red-600">{giftingVoucher.code}</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Khách hàng được chọn sẽ nhận thông báo trên hệ thống và có thể bấm Lưu mã vào ví ưu đãi.
            </p>

            <form onSubmit={handleSendGift} className="space-y-4 text-sm flex-grow flex flex-col overflow-hidden">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Đối tượng nhận quà</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input
                      type="radio"
                      name="send_mode"
                      checked={giftForm.send_to_all}
                      onChange={() => setGiftForm({ ...giftForm, send_to_all: true, selected_users: [] })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    Tất cả khách hàng ({customers.length} người)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input
                      type="radio"
                      name="send_mode"
                      checked={!giftForm.send_to_all}
                      onChange={() => setGiftForm({ ...giftForm, send_to_all: false })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    Chọn từng khách hàng
                  </label>
                </div>
              </div>

              {!giftForm.send_to_all && (
                <div className="border border-gray-200 rounded-xl p-3 flex flex-col max-h-56">
                  <input
                    type="text"
                    value={giftForm.search_term}
                    onChange={(e) => setGiftForm({ ...giftForm, search_term: e.target.value })}
                    placeholder="Tìm tên hoặc email khách hàng..."
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="overflow-y-auto space-y-1.5 flex-grow pr-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="text-xs text-gray-400 py-4 text-center">Không tìm thấy khách hàng nào</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-xs border border-transparent hover:border-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={giftForm.selected_users.includes(c.id)}
                              onChange={() => handleToggleSelectUser(c.id)}
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            />
                            <div>
                              <div className="font-bold text-gray-800">{c.full_name}</div>
                              <div className="text-gray-500">{c.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            ID: #{c.id}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-2 flex justify-between">
                    <span>Đã chọn: <strong>{giftForm.selected_users.length}</strong> khách hàng</span>
                    {giftForm.selected_users.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setGiftForm({ ...giftForm, selected_users: [] })}
                        className="text-red-600 hover:underline"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Lời chúc gửi kèm</label>
                <textarea
                  rows="3"
                  required
                  value={giftForm.custom_message}
                  onChange={(e) => setGiftForm({ ...giftForm, custom_message: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={giftingLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {giftingLoading ? 'Đang gửi...' : 'Gửi tặng ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VouchersManagement;
