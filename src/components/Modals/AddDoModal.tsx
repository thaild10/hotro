import React, { useState } from "react";
import { X, Plus, Search, Trash2, Check, ChevronLeft, Save, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CardProduct, Brand } from "../../types";
import { cn } from "../../lib/utils";

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
    <motion.div 
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-pastel-bg z-[1000] flex flex-col md:max-w-[430px] md:mx-auto md:border-x md:border-slate-200"
    >
      <div className="bg-white px-4 h-16 flex items-center gap-3 border-b border-pastel-border shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors active:scale-95">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
          <span className="font-black text-slate-600 text-sm">Quay lại</span>
        </button>
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <h3 className="font-black text-lg text-emerald-500 uppercase tracking-tight text-center flex-1 pr-12">Sản phẩm dò</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-slate-50">
        {/* Search Header */}
        <div className="bg-white p-4 border-b border-pastel-border sticky top-0 z-20 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input 
              type="text"
              value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-11 pr-4 py-3.5 bg-pastel-bg rounded-2xl text-[13px] font-bold outline-none border-2 border-transparent focus:border-emerald-300 transition-all shadow-inner"
            />
          </div>

          <AnimatePresence>
            {isDropdownOpen && searchQuery && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute left-4 right-4 mt-2 bg-white rounded-3xl border border-pastel-border shadow-2xl max-h-[400px] overflow-y-auto no-scrollbar z-[30] p-1 border-emerald-100"
              >
                {filteredProducts.length > 0 ? filteredProducts.map(p => {
                  const isAdded = products.some(x => x.productId === p.id);
                  return (
                    <button 
                      key={p.id} onClick={() => handleAddProduct(p)} disabled={isAdded}
                      className={cn("w-full p-4 flex items-center justify-between rounded-2xl active:scale-98 transition-all border-b border-slate-50 last:border-0", isAdded ? "opacity-50" : "hover:bg-emerald-50")}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 bg-pastel-bg rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-emerald-400" /></div>
                        <span className="font-bold text-slate-700 text-sm line-clamp-1">{p.name}</span>
                      </div>
                      {isAdded ? <Check className="w-5 h-5 text-emerald-500" /> : <Plus className="w-5 h-5 text-slate-300" />}
                    </button>
                  );
                }) : <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Không có kết quả</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected List */}
        <div className="p-4 space-y-4 pb-24">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Đã chọn ({products.length})</h4>
            {products.length > 0 && <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Kéo xuống để lưu</span>}
          </div>

          <div className="space-y-3">
            {products.map(cp => {
              const p = availableProducts.find(x => x.id === cp.productId);
              if (!p) return null;
              return (
                <div key={cp.productId} className="bg-white p-4 rounded-3xl border border-pastel-border shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-pastel-bg rounded-xl flex items-center justify-center overflow-hidden border border-emerald-50">
                         {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-emerald-500/30" />}
                       </div>
                       <span className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</span>
                    </div>
                    <button onClick={() => handleRemoveProduct(cp.productId)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                  <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                    <button 
                      onClick={() => handleUpdateTag(cp.productId, 'Dò')}
                      className={cn("flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl transition-all", cp.tag === 'Dò' ? "bg-amber-500 text-white shadow-lg shadow-amber-100" : "text-slate-400 hover:text-slate-600")}
                    >
                      Đ ang Dò
                    </button>
                    <button 
                      onClick={() => handleUpdateTag(cp.productId, 'Dò xong')}
                      className={cn("flex-1 py-2.5 text-[11px] font-black uppercase rounded-xl transition-all", cp.tag === 'Dò xong' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "text-slate-400 hover:text-slate-600")}
                    >
                      Dò Xong
                    </button>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[40px] border-2 border-dashed border-slate-200">
                <Package className="w-12 h-12 text-slate-200 mb-2" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Chưa có sản phẩm nào được chọn</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-pastel-border shrink-0">
        <button onClick={handleSave} className="w-full bg-emerald-500 text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-transform flex items-center justify-center gap-3">
          <Save className="w-5 h-5" /> Lưu danh sách
        </button>
      </div>
    </motion.div>
  );
}
