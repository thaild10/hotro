import React, { useState } from "react";
import { X, Package, Box, Tags, Plus, Pencil, Trash2, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { motion } from "motion/react";
import { Brand, ProductCategory, Product } from "../../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface ProductManagementModalProps {
  brands: Brand[];
  categories: ProductCategory[];
  products: Product[];
  onUpdateBrands: (brands: Brand[]) => void;
  onUpdateCategories: (categories: ProductCategory[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onClose: () => void;
}

export default function ProductManagementModal({
  brands, categories, products,
  onUpdateBrands, onUpdateCategories, onUpdateProducts,
  onClose
}: ProductManagementModalProps) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-4xl h-[90vh] sm:h-[700px] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-pastel-border bg-pastel-bg/50 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab(0)}
              className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${activeTab === 0 ? 'bg-amber-500 text-white' : 'bg-white text-pastel-subtext border border-pastel-border'}`}
            >
              1. Quản lý hãng
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${activeTab === 1 ? 'bg-amber-500 text-white' : 'bg-white text-pastel-subtext border border-pastel-border'}`}
            >
              2. Quản lý loại
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${activeTab === 2 ? 'bg-amber-500 text-white' : 'bg-white text-pastel-subtext border border-pastel-border'}`}
            >
              3. Quản lý sản phẩm
            </button>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pastel-subtext hover:bg-pastel-bg hover:text-slate-700 transition-colors shadow-sm ml-auto absolute top-4 right-4 sm:static m-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-slate-50">
          {activeTab === 0 && (
            <BrandTab brands={brands} onUpdateBrands={onUpdateBrands} setConfirmConfig={setConfirmConfig} />
          )}
          {activeTab === 1 && (
            <CategoryTab categories={categories} onUpdateCategories={onUpdateCategories} setConfirmConfig={setConfirmConfig} />
          )}
          {activeTab === 2 && (
            <ProductTab products={products} brands={brands} categories={categories} onUpdateProducts={onUpdateProducts} setConfirmConfig={setConfirmConfig} />
          )}
        </div>
      </motion.div>

      {confirmConfig && (
        <ConfirmDialog 
          message={confirmConfig.message}
          onConfirm={confirmConfig.action}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}

// Sub-components for tabs
function BrandTab({ 
  brands, 
  onUpdateBrands, 
  setConfirmConfig 
}: { 
  brands: Brand[], 
  onUpdateBrands: (b: Brand[]) => void, 
  setConfirmConfig: any 
}) {
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newBrand: Brand = { id: `brand-${Date.now()}`, name: newName.trim() };
    onUpdateBrands([...brands, newBrand]);
    setNewName("");
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateBrands(brands.map(b => b.id === id ? { ...b, name: editName.trim() } : b));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa hãng này?",
      action: () => {
        onUpdateBrands(brands.filter(b => b.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const sortedBrands = [...brands].sort((a, b) => {
    return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nhập tên hãng mới..."
            className="flex-1 min-w-0 bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
          />
          <button 
            onClick={handleCreate}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-transform whitespace-nowrap"
          >
            Tạo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none w-full sm:w-auto"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
            {sortAsc ? "Từ A - Z" : "Từ Z - A"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-12 text-center">STT</div>
          <div className="flex-1">Tên hãng</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedBrands.map((brand, idx) => (
            <div key={brand.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors">
              <div className="w-12 text-center text-sm font-bold text-pastel-subtext">
                {idx + 1}
              </div>
              <div className="flex-1 font-bold text-sm text-slate-700">
                {editingId === brand.id ? (
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(brand.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full bg-white border-b-2 border-amber-500 px-2 py-1 outline-none"
                  />
                ) : (
                  <span className="uppercase">{brand.name}</span>
                )}
              </div>
              <div className="w-24 flex items-center justify-end gap-1">
                {editingId === brand.id ? (
                  <>
                    <button 
                      onClick={() => handleSaveEdit(brand.id)}
                      className="p-2 text-white bg-amber-500 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 text-slate-500 bg-slate-100 rounded-lg active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { setEditingId(brand.id); setEditName(brand.name); }}
                      className="p-2 text-amber-500 bg-amber-50 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(brand.id)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {sortedBrands.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có hãng nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryTab({ 
  categories, 
  onUpdateCategories, 
  setConfirmConfig 
}: { 
  categories: ProductCategory[], 
  onUpdateCategories: (c: ProductCategory[]) => void, 
  setConfirmConfig: any 
}) {
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newCategory: ProductCategory = { id: `cat-${Date.now()}`, name: newName.trim() };
    onUpdateCategories([...categories, newCategory]);
    setNewName("");
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateCategories(categories.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa loại sản phẩm này?",
      action: () => {
        onUpdateCategories(categories.filter(c => c.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const sortedCategories = [...categories].sort((a, b) => {
    return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nhập tên loại sản phẩm mới..."
            className="flex-1 min-w-0 bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
          />
          <button 
            onClick={handleCreate}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-transform whitespace-nowrap"
          >
            Tạo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none w-full sm:w-auto"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
            {sortAsc ? "Từ A - Z" : "Từ Z - A"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-12 text-center">STT</div>
          <div className="flex-1">Tên loại</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedCategories.map((category, idx) => (
            <div key={category.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors">
              <div className="w-12 text-center text-sm font-bold text-pastel-subtext">
                {idx + 1}
              </div>
              <div className="flex-1 font-bold text-sm text-slate-700">
                {editingId === category.id ? (
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(category.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full bg-white border-b-2 border-amber-500 px-2 py-1 outline-none"
                  />
                ) : (
                  <span className="uppercase">{category.name}</span>
                )}
              </div>
              <div className="w-24 flex items-center justify-end gap-1">
                {editingId === category.id ? (
                  <>
                    <button 
                      onClick={() => handleSaveEdit(category.id)}
                      className="p-2 text-white bg-amber-500 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 text-slate-500 bg-slate-100 rounded-lg active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { setEditingId(category.id); setEditName(category.name); }}
                      className="p-2 text-amber-500 bg-amber-50 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {sortedCategories.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có loại sản phẩm nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductTab({ 
  products, 
  brands,
  categories,
  onUpdateProducts, 
  setConfirmConfig 
}: { 
  products: Product[],
  brands: Brand[],
  categories: ProductCategory[],
  onUpdateProducts: (p: Product[]) => void, 
  setConfirmConfig: any 
}) {
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !selectedBrand || !selectedCategory) {
      setError("Vui lòng nhập tên, chọn hãng và loại");
      setTimeout(() => setError(null), 3000);
      return;
    }
    const newProduct: Product = { 
      id: `prod-${Date.now()}`, 
      name: newName.trim(),
      brandId: selectedBrand,
      categoryId: selectedCategory
    };
    onUpdateProducts([...products, newProduct]);
    setNewName("");
    setError(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateProducts(products.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa sản phẩm này?",
      action: () => {
        onUpdateProducts(products.filter(p => p.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const sortedProducts = [...products].sort((a, b) => {
    return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border relative">
        {error && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-bounce whitespace-nowrap">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <input 
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Tên sản phẩm mới..."
            className="flex-1 bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors min-w-0"
          />
          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <select
              value={selectedBrand}
              onChange={e => { setSelectedBrand(e.target.value); setError(null); }}
              className="flex-1 sm:flex-none sm:w-[140px] bg-pastel-bg rounded-xl px-3 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors truncate"
            >
              <option value="">- Chọn hãng -</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setError(null); }}
              className="flex-1 sm:flex-none sm:w-[140px] bg-pastel-bg rounded-xl px-3 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors truncate"
            >
              <option value="">- Chọn loại -</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleCreate}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-transform whitespace-nowrap"
          >
            Tạo
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none text-sm w-full lg:w-auto shrink-0"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
            {sortAsc ? "Từ A - Z" : "Từ Z - A"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-12 text-center">STT</div>
          <div className="flex-1">Tên sản phẩm</div>
          <div className="w-32">Hãng</div>
          <div className="w-32">Loại</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedProducts.map((product, idx) => {
            const brand = brands.find(b => b.id === product.brandId);
            const category = categories.find(c => c.id === product.categoryId);
            return (
              <div key={product.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors">
                <div className="w-12 text-center text-sm font-bold text-pastel-subtext">
                  {idx + 1}
                </div>
                <div className="flex-1 font-bold text-sm text-slate-700 pr-2">
                  {editingId === product.id ? (
                    <input 
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(product.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full bg-white border-b-2 border-amber-500 px-2 py-1 outline-none"
                    />
                  ) : (
                    <span className="uppercase">{product.name}</span>
                  )}
                </div>
                <div className="w-32 text-xs font-bold text-slate-500 truncate pr-2">
                  {brand?.name || '-'}
                </div>
                <div className="w-32 text-xs font-bold text-slate-500 truncate pr-2">
                  {category?.name || '-'}
                </div>
                <div className="w-24 flex items-center justify-end gap-1">
                  {editingId === product.id ? (
                    <>
                      <button 
                        onClick={() => handleSaveEdit(product.id)}
                        className="p-2 text-white bg-amber-500 rounded-lg active:scale-95"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2 text-slate-500 bg-slate-100 rounded-lg active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setEditingId(product.id); setEditName(product.name); }}
                        className="p-2 text-amber-500 bg-amber-50 rounded-lg active:scale-95"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {sortedProducts.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có sản phẩm nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
