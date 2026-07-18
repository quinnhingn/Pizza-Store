/**
 * Định dạng số thành chuỗi tiền tệ Việt Nam (VNĐ)
 * @param {number|string} amount Số tiền cần định dạng
 * @returns {string} Chuỗi tiền tệ đã định dạng (ví dụ: "220.000 ₫")
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

export default formatCurrency;
