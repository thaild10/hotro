import React, { useState } from "react";
import { X, Plus, Search, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CardProduct, Brand } from "../../types";

interface AddDoModalProps {
  initialProducts: CardProduct[];
  availableProducts: Product[];
  availableBrands: Brand[];
  onSave: (products: CardProduct[]) => void;
  onClose: () => void;
}

export default function AddDoModal({ initialProducts, availableProducts, availableBrands, onSave, onClose }: AddDoModalProps) {
  const [products, setProducts] = useState<CardProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredProducts = availableProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddProduct = (product: Product) => {
    if (!products.find(p => p.productId === product.id)) {
      setProducts([...products, { productId: product.id, tag: "Dò" }]);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleUpdateTag = (productId: string, tag: "Dò" | "Dò xong") => {
    setProducts(products.map(p => p.productId === productId ? { ...p, tag } : p));
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter(p => p.productId !== productId));
  };

  const handleSave = () => {
    onSave(products);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-pastel-border bg-pastel-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Add/Dò Sản Phẩm</h2>
              <p className="text-sm font-bold text-pastel-subtext mt-1">Quản lý sản phẩm dò cho thẻ</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pastel-subtext hover:bg-pastel-bg hover:text-slate-700 transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="relative">
            <label className="text-sm font-bold text-slate-700 mb-2 block">Thêm sản phẩm</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-pastel-subtext" />
              </div>
              <input
                type="text"
                className="w-full bg-pastel-bg/50 border border-pastel-border rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-300 transition-colors"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
            </div>
            
            <AnimatePresence>
              {isDropdownOpen && searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-10 w-full mt-2 bg-white rounded-2xl border border-pastel-border shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => {
                      const isAdded = products.some(p => p.productId === product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleAddProduct(product)}
                          disabled={isAdded}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between ${isAdded ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-pastel-bg active:bg-emerald-50'} border-b border-pastel-border/50 last:border-0`}
                        >
                          <span className="font-bold text-slate-700">{product.name}</span>
                          {isAdded && <Check className="w-4 h-4 text-emerald-500" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-sm font-medium text-pastel-subtext italic">
                      Không tìm thấy sản phẩm phù hợp.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 block">Danh sách sản phẩm đang dò</label>
            {products.length === 0 ? (
              <div className="text-center py-6 bg-pastel-bg/30 border border-dashed border-pastel-border rounded-3xl">
                <p className="text-sm font-medium text-pastel-subtext italic">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((cardProduct) => {
                  const productDef = availableProducts.find(p => p.id === cardProduct.productId);
                  if (!productDef) return null;
                  return (
                    <div key={cardProduct.productId} className="flex items-center justify-between bg-white border border-pastel-border rounded-2xl p-3 shadow-sm">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-bold text-slate-800 line-clamp-2">{productDef.name}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => handleUpdateTag(cardProduct.productId, 'Dò')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${cardProduct.tag === 'Dò' ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Dò
                          </button>
                          <button
                            onClick={() => handleUpdateTag(cardProduct.productId, 'Dò xong')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${cardProduct.tag === 'Dò xong' ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Dò xong
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(cardProduct.productId)}
                          className="p-2 text-pastel-subtext hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-pastel-border bg-slate-50">
          <button
            onClick={handleSave}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-[0.98] transition-transform"
          >
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
