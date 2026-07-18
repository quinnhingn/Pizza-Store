import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const DEFAULT_PIZZA_IMG = 'http://localhost:8000/static/uploads/default_pizza.png';

const getIngredientName = (ing) => {
  if (!ing) return '';
  if (typeof ing === 'string') return ing;
  return ing.name || ing.ingredient_name || '';
};

const ProductCard = ({ product, categoryNameMap = {}, onSelectProduct }) => {
  const [imgError, setImgError] = useState(false);

  const categoryName = categoryNameMap[product.category_id] || 'Món Ăn';
  const displayImage = (!imgError && product.image_url) ? product.image_url : DEFAULT_PIZZA_IMG;

  // Kiểm tra trạng thái món có sẵn sàng để bán hay không
  const isAvailable = product.is_available !== false && product.is_available !== 0 && product.status !== 'inactive' && product.status !== 'out_of_stock';

  const handleImgError = () => {
    if (!imgError) {
      setImgError(true);
    }
  };

  const ingredientsList = Array.isArray(product.ingredients) ? product.ingredients : [];
  const displayIngredients = ingredientsList.slice(0, 3);
  const remainingCount = ingredientsList.length - 3;

  return (
    <div 
      onClick={() => isAvailable && onSelectProduct && onSelectProduct(product)}
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full ${
        isAvailable ? 'cursor-pointer' : 'opacity-80 cursor-default'
      }`}
    >
      {/* Container Ảnh */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={displayImage}
          alt={product.name}
          onError={handleImgError}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            isAvailable ? 'group-hover:scale-105' : 'filter grayscale-[25%]'
          }`}
          loading="lazy"
        />

        {/* Badge Danh Mục (Góc trên bên trái) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-black/60 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium tracking-wide">
            {categoryName}
          </span>
        </div>

        {/* Tag Trạng Thái: Còn món / Hết món (Góc trên bên phải) */}
        <div className="absolute top-3 right-3 z-10">
          {isAvailable ? (
            <span className="bg-emerald-600/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Còn món
            </span>
          ) : (
            <span className="bg-stone-800/95 text-gray-300 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-sm border border-stone-600/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Hết món
            </span>
          )}
        </div>

        {/* Lớp phủ nhạt khi hover giúp tăng độ sâu */}
        {isAvailable && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
        )}
      </div>

      {/* Thân thẻ thông tin */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          {/* Tên món ăn */}
          <h3 className={`font-bold text-gray-900 text-lg leading-snug line-clamp-1 transition-colors ${
            isAvailable ? 'group-hover:text-red-600' : 'text-gray-600'
          }`}>
            {product.name}
          </h3>

          {/* Mô tả món ăn (ngay dưới tên món, tối đa 2 dòng) */}
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed min-h-[2.25rem]">
            {product.description || 'Hương vị tuyệt hảo từ nguyên liệu tươi ngon chuẩn vị Ý.'}
          </p>

          {/* Thẻ nguyên liệu (ngay dưới phần mô tả) */}
          {ingredientsList.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
              {displayIngredients.map((ing, idx) => {
                const ingName = getIngredientName(ing);
                return (
                  <span
                    key={ing?.id || ingName || idx}
                    className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-normal"
                  >
                    {ingName}
                  </span>
                );
              })}
              {remainingCount > 0 && (
                <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold">
                  +{remainingCount} nữa
                </span>
              )}
            </div>
          )}
        </div>

        {/* Phần Giá & Nút Chọn món / Hết món */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 mt-auto">
          <div>
            <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">
              Giá bán
            </span>
            <span className={`text-xl font-extrabold tracking-tight ${
              isAvailable ? 'text-red-600' : 'text-gray-400'
            }`}>
              {formatCurrency(product.price)}
            </span>
          </div>

          {isAvailable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectProduct) {
                  onSelectProduct(product);
                }
              }}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Chọn món</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-200 text-gray-400 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-not-allowed shrink-0"
            >
              <span>Hết món</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
