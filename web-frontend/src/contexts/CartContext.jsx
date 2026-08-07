import { createContext, useState, useEffect, useCallback } from 'react';
import cartAPI from '../api/cartAPI';
import vouchersAPI from '../api/vouchersAPI';
import useAuth from '../hooks/useAuth';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState(null);

  // Helper cho Guest Cart trong localStorage
  const getGuestCart = () => {
    try {
      const data = localStorage.getItem('guest_cart');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const saveGuestCart = (items) => {
    localStorage.setItem('guest_cart', JSON.stringify(items));
    updateGuestSummary(items);
  };

  const updateGuestSummary = (items) => {
    setCartItems(items);
    const totalQty = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const totalMoney = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
    setTotalItems(totalQty);
    setSubtotal(totalMoney);
  };

  // Đồng bộ giỏ hàng từ server nếu đã đăng nhập
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      const guestItems = getGuestCart();
      updateGuestSummary(guestItems);
      return;
    }
    setLoading(true);
    try {
      const data = await cartAPI.getCart();
      if (data) {
        setCartItems(data.items || []);
        setTotalItems(data.total_items || 0);
        setSubtotal(Number(data.subtotal || 0));
      }
    } catch (error) {
      console.error('Lấy thông tin giỏ hàng thất bại:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Đồng bộ guest_cart lên server ngay sau khi đăng nhập
  useEffect(() => {
    const syncGuestCartToServer = async () => {
      if (isAuthenticated && user?.role === 'customer') {
        const guestItems = getGuestCart();
        if (guestItems.length > 0) {
          try {
            for (const item of guestItems) {
              await cartAPI.addItem({
                product_id: item.product_id,
                size_name: item.size_name,
                toppings: item.toppings || [],
                quantity: item.quantity || 1,
                note: item.note || "",
                unit_price: item.unit_price || 0
              });
            }
            localStorage.removeItem('guest_cart');
          } catch (e) {
            console.error('Lỗi khi đồng bộ giỏ hàng khách lên server:', e);
          }
        }
        fetchCart();
      } else {
        const guestItems = getGuestCart();
        updateGuestSummary(guestItems);
      }
    };
    syncGuestCartToServer();
  }, [isAuthenticated, fetchCart]);

  // Thêm món vào giỏ
  const addToCart = async (payload) => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        const addedItem = await cartAPI.addItem(payload);
        await fetchCart();
        return { success: true, item: addedItem };
      } catch (error) {
        const msg = error.response?.data?.detail || error.message || "Thêm vào giỏ hàng thất bại";
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    } else {
      // Logic xử lý giỏ hàng offline cho Guest
      const guestItems = getGuestCart();
      const targetSize = (payload.size_name || "").strip?.() || payload.size_name || "";
      const targetNote = (payload.note || "").trim().toLowerCase();

      // So sánh topping
      const normalizeTop = (tops) => (tops || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      const topsMatch = (t1, t2) => {
        const n1 = normalizeTop(t1);
        const n2 = normalizeTop(t2);
        if (n1.length !== n2.length) return false;
        return n1.every((item, idx) => (item.name || "").trim().toLowerCase() === (n2[idx].name || "").trim().toLowerCase());
      };

      const existingIndex = guestItems.findIndex(it => {
        const itSize = (it.size_name || "").strip?.() || it.size_name || "";
        const itNote = (it.note || "").trim().toLowerCase();
        return it.product_id === payload.product_id &&
               itSize === targetSize &&
               itNote === targetNote &&
               topsMatch(it.toppings, payload.toppings);
      });

      if (existingIndex > -1) {
        guestItems[existingIndex].quantity += payload.quantity;
        guestItems[existingIndex].total_price = Number(guestItems[existingIndex].unit_price) * guestItems[existingIndex].quantity;
      } else {
        guestItems.push({
          id: Date.now(), // ID tạm cho guest
          ...payload,
          product: payload.product_info || { name: `Sản phẩm #${payload.product_id}`, price: payload.unit_price },
          total_price: Number(payload.unit_price) * payload.quantity
        });
      }
      saveGuestCart(guestItems);
      return { success: true };
    }
  };

  // Cập nhật số lượng món
  const updateCartItem = async (itemId, payload) => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        await cartAPI.updateItem(itemId, payload);
        await fetchCart();
        return { success: true };
      } catch (error) {
        const msg = error.response?.data?.detail || error.message || "Cập nhật giỏ hàng thất bại";
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    } else {
      const guestItems = getGuestCart();
      const idx = guestItems.findIndex(it => it.id === itemId);
      if (idx > -1) {
        if (payload.quantity !== undefined) guestItems[idx].quantity = payload.quantity;
        if (payload.size_name !== undefined) guestItems[idx].size_name = payload.size_name;
        if (payload.toppings !== undefined) guestItems[idx].toppings = payload.toppings;
        if (payload.note !== undefined) guestItems[idx].note = payload.note;
        guestItems[idx].total_price = Number(guestItems[idx].unit_price) * guestItems[idx].quantity;
        saveGuestCart(guestItems);
      }
      return { success: true };
    }
  };

  // Xóa món khỏi giỏ
  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        await cartAPI.deleteItem(itemId);
        await fetchCart();
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message };
      } finally {
        setLoading(false);
      }
    } else {
      const guestItems = getGuestCart().filter(it => it.id !== itemId);
      saveGuestCart(guestItems);
      return { success: true };
    }
  };

  // Xóa sạch giỏ hàng
  const clearCart = async () => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        await cartAPI.clearCart();
        await fetchCart();
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message };
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.removeItem('guest_cart');
      updateGuestSummary([]);
      return { success: true };
    }
  };

  // Tự động kiểm tra/tính lại số tiền giảm khi subtotal thay đổi
  useEffect(() => {
    if (appliedVoucher && appliedVoucher.code) {
      if (subtotal === 0) {
        setAppliedVoucher(null);
        setVoucherError(null);
        return;
      }
      vouchersAPI.validateVoucher(appliedVoucher.code, subtotal)
        .then(res => {
          if (res.valid) {
            setAppliedVoucher({
              code: res.code,
              discount_amount: res.discount_amount,
              details: res.voucher_details
            });
            setVoucherError(null);
          } else {
            setAppliedVoucher(null);
            setVoucherError(res.message);
          }
        })
        .catch(() => {
          setAppliedVoucher(null);
        });
    }
  }, [subtotal]);

  // Áp dụng voucher
  const applyVoucher = async (code) => {
    setVoucherError(null);
    if (!code || !code.trim()) {
      setVoucherError("Vui lòng nhập mã giảm giá");
      return { success: false, message: "Vui lòng nhập mã giảm giá" };
    }
    try {
      const res = await vouchersAPI.validateVoucher(code.trim(), subtotal);
      if (res.valid) {
        setAppliedVoucher({
          code: res.code,
          discount_amount: res.discount_amount,
          details: res.voucher_details
        });
        return { success: true, data: res };
      } else {
        setAppliedVoucher(null);
        setVoucherError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Lỗi khi kiểm tra mã giảm giá";
      setAppliedVoucher(null);
      setVoucherError(msg);
      return { success: false, message: msg };
    }
  };

  // Hủy voucher
  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
  };

  const value = {
    cartItems,
    totalItems,
    subtotal,
    loading,
    appliedVoucher,
    voucherError,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyVoucher,
    removeVoucher
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
