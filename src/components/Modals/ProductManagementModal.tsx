import React, { useState } from "react";
import { X, Package, Box, Tags, Plus, Pencil, Trash2, ArrowDownAZ, ArrowUpZA, Save, Image as ImageIcon, CloudUpload } from "lucide-react";
import { motion } from "motion/react";
import { Brand, ProductCategory, Product, ImageCompressionSettings } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { uploadToFirebase } from "../../lib/imageUtils";

interface ProductManagementModalProps {
  brands: Brand[];
  categories: ProductCategory[];
  products: Product[];
  onUpdateBrands: (brands: Brand[]) => void;
  onUpdateCategories: (categories: ProductCategory[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onClose: () => void;
  compressionSettings: ImageCompressionSettings;
  deviceView?: 'desktop' | 'mobile';
}

export default function ProductManagementModal({
  brands, categories, products,
  onUpdateBrands, onUpdateCategories, onUpdateProducts,
  onClose,
  compressionSettings,
  deviceView = 'desktop'
}: ProductManagementModalProps) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[2000] bg-white flex flex-col overflow-hidden",
        deviceView === 'mobile' ? "max-w-[430px] mx-auto shadow-2xl border-x border-slate-200" : "w-full"
      )}
    >
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-pastel-border shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors shrink-0"
          >
            ← Trang chủ
          </button>
          <div className="h-8 w-[1px] bg-pastel-border/50" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Sản phẩm</h2>
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Kho hàng & Thương hiệu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-pastel-bg/50 px-6 py-3 border-b border-pastel-border shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab(0)}
            className={cn(
              "text-[10px] font-black px-4 py-2 rounded-xl transition-all whitespace-nowrap uppercase tracking-wider shadow-sm",
              activeTab === 0 ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-pastel-border'
            )}
          >
            1. Hãng SX
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={cn(
              "text-[10px] font-black px-4 py-2 rounded-xl transition-all whitespace-nowrap uppercase tracking-wider shadow-sm",
              activeTab === 1 ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-pastel-border'
            )}
          >
            2. Phân loại
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={cn(
              "text-[10px] font-black px-4 py-2 rounded-xl transition-all whitespace-nowrap uppercase tracking-wider shadow-sm",
              activeTab === 2 ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-pastel-border'
            )}
          >
            3. Sản phẩm
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-slate-50/50 no-scrollbar">
        {activeTab === 0 && (
          <BrandTab brands={brands} onUpdateBrands={onUpdateBrands} setConfirmConfig={setConfirmConfig} />
        )}
        {activeTab === 1 && (
          <CategoryTab categories={categories} onUpdateCategories={onUpdateCategories} setConfirmConfig={setConfirmConfig} />
        )}
        {activeTab === 2 && (
          <ProductTab 
            products={products} 
            brands={brands} 
            categories={categories} 
            onUpdateProducts={onUpdateProducts} 
            setConfirmConfig={setConfirmConfig} 
            compressionSettings={compressionSettings}
          />
        )}
      </div>


      {confirmConfig && (
        <ConfirmDialog 
          message={confirmConfig.message}
          onConfirm={confirmConfig.action}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </motion.div>
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
                  <span className="">{brand.name}</span>
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
                  <span className="">{category.name}</span>
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
  setConfirmConfig,
  compressionSettings
}: { 
  products: Product[],
  brands: Brand[],
  categories: ProductCategory[],
  onUpdateProducts: (p: Product[]) => void, 
  setConfirmConfig: any,
  compressionSettings: ImageCompressionSettings
}) {
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToFirebase(file, 'products', compressionSettings);
        setImageUrl(url);
      } catch (error) {
        console.error("Upload fail:", error);
        alert(error instanceof Error ? error.message : "Upload ảnh thất bại!");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = () => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa ảnh sản phẩm này?",
      action: () => {
        setImageUrl("");
        setConfirmConfig(null);
      }
    });
  };
  
  const [showDetailsInputs, setShowDetailsInputs] = useState(false);
  const [details, setDetails] = useState({
    importPrice: "",
    sellingPrice: "",
    costPrice: "",
    weight: "",
    usage: "",
    description: "",
    strength: "",
    daysToUse: ""
  });

  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null);
  
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
      categoryId: selectedCategory,
      imageUrl: imageUrl || undefined,
      details: {
        importPrice: details.importPrice ? Number(details.importPrice) : undefined,
        sellingPrice: details.sellingPrice ? Number(details.sellingPrice) : undefined,
        costPrice: details.costPrice ? Number(details.costPrice) : undefined,
        weight: details.weight || undefined,
        usage: details.usage || undefined,
        description: details.description || undefined,
        strength: details.strength || undefined,
        daysToUse: details.daysToUse ? Number(details.daysToUse) : undefined
      }
    };
    onUpdateProducts([...products, newProduct]);
    setNewName("");
    setImageUrl("");
    setDetails({
      importPrice: "",
      sellingPrice: "",
      costPrice: "",
      weight: "",
      usage: "",
      description: "",
      strength: "",
      daysToUse: ""
    });
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
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={cn(
                "w-full sm:w-[48px] h-[48px] shrink-0 bg-pastel-bg rounded-xl border-2 border-dashed border-pastel-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-amber-400 transition-colors relative group",
                isUploading && "opacity-50 cursor-wait",
                imageUrl && "border-solid border-amber-500"
              )}
            >
              {imageUrl ? (
                <div className="relative w-full h-full">
                  <img src={imageUrl} alt="product" className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <CloudUpload className="w-4 h-4 text-pastel-subtext" />
                  <span className="text-[8px] font-black text-pastel-subtext uppercase leading-none mt-0.5">Ảnh</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
          <button 
            onClick={handleCreate}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-transform whitespace-nowrap"
          >
            Tạo
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setShowDetailsInputs(!showDetailsInputs)}
            className="text-xs font-bold text-amber-500 flex items-center gap-1 hover:underline self-start"
          >
            <Plus className={`w-3 h-3 transition-transform ${showDetailsInputs ? 'rotate-45' : ''}`} />
            Thông tin chi tiết
          </button>

          {showDetailsInputs && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-pastel-bg/30 p-3 rounded-2xl border border-pastel-border/50 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Giá nhập</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={details.importPrice}
                  onChange={e => setDetails(prev => ({ ...prev, importPrice: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Giá bán</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={details.sellingPrice}
                  onChange={e => setDetails(prev => ({ ...prev, sellingPrice: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Giá vốn</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={details.costPrice}
                  onChange={e => setDetails(prev => ({ ...prev, costPrice: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Trọng lượng (g)</label>
                <input 
                  type="text" 
                  placeholder="g"
                  value={details.weight}
                  onChange={e => setDetails(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Công dụng</label>
                <input 
                  type="text" 
                  placeholder="Công dụng..."
                  value={details.usage}
                  onChange={e => setDetails(prev => ({ ...prev, usage: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Hướng dẫn</label>
                <input 
                  type="text" 
                  placeholder="Hướng dẫn..."
                  value={details.description}
                  onChange={e => setDetails(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Độ mạnh</label>
                <input 
                  type="text" 
                  placeholder="Độ mạnh..."
                  value={details.strength}
                  onChange={e => setDetails(prev => ({ ...prev, strength: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Số ngày dùng</label>
                <input 
                  type="number" 
                  placeholder="Ngày"
                  value={details.daysToUse}
                  onChange={e => setDetails(prev => ({ ...prev, daysToUse: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
            </div>
          )}
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
          <div className="w-10 text-center">STT</div>
          <div className="flex-1">Tên sản phẩm</div>
          <div className="w-24">Hãng</div>
          <div className="w-24">Loại</div>
          <div className="w-20 text-center">Nội dung</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedProducts.map((product, idx) => {
            const brand = brands.find(b => b.id === product.brandId);
            const category = categories.find(c => c.id === product.categoryId);
            const isDetailed = product.details && Object.values(product.details).every(v => v !== undefined && v !== "");
            const hasDetails = product.details && Object.values(product.details).some(v => v !== undefined && v !== "");
            
            return (
              <div key={product.id} className="flex flex-col border-b border-pastel-border/30 last:border-0">
                <div className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors">
                  <div className="w-10 text-center text-sm font-bold text-pastel-subtext">
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
                      <span className="">{product.name}</span>
                    )}
                  </div>
                  <div className="w-24 text-[11px] font-bold text-slate-500 truncate pr-2">
                    {brand?.name || '-'}
                  </div>
                  <div className="w-24 text-[11px] font-bold text-slate-500 truncate pr-2">
                    {category?.name || '-'}
                  </div>
                  <div className="w-20 flex justify-center">
                    <button 
                      onClick={() => setViewDetailsId(viewDetailsId === product.id ? null : product.id)}
                      className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-full transition-colors whitespace-nowrap",
                        isDetailed ? "bg-teal-100 text-teal-600" : "bg-rose-100 text-rose-500"
                      )}
                    >
                      Chi tiết
                    </button>
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

                {viewDetailsId === product.id && (
                  <div className="p-4 bg-pastel-bg/20 rounded-2xl mx-10 mb-2 border border-pastel-border/50 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase text-amber-500">Thông tin chi tiết</h4>
                      <button 
                        onClick={() => setEditingDetailsId(editingDetailsId === product.id ? null : product.id)}
                        className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-pastel-border hover:bg-amber-50 transition-colors"
                      >
                        {editingDetailsId === product.id ? "Huỷ" : "Sửa chi tiết"}
                      </button>
                    </div>

                    {editingDetailsId === product.id ? (
                      <DetailEditor 
                        product={product} 
                        brands={brands}
                        categories={categories}
                        compressionSettings={compressionSettings}
                        setConfirmConfig={setConfirmConfig}
                        onSave={(updatedProduct) => {
                          onUpdateProducts(products.map(p => p.id === product.id ? updatedProduct : p));
                          setEditingDetailsId(null);
                        }} 
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                        <div><div className="text-[10px] font-black text-pastel-subtext uppercase">Giá nhập</div><div className="font-bold">{product.details?.importPrice?.toLocaleString() || '0'}đ</div></div>
                        <div><div className="text-[10px] font-black text-pastel-subtext uppercase">Giá bán</div><div className="font-bold">{product.details?.sellingPrice?.toLocaleString() || '0'}đ</div></div>
                        <div><div className="text-[10px] font-black text-pastel-subtext uppercase">Giá vốn</div><div className="font-bold">{product.details?.costPrice?.toLocaleString() || '0'}đ</div></div>
                        <div><div className="text-[10px] font-black text-pastel-subtext uppercase">Trọng lượng</div><div className="font-bold">{product.details?.weight || '-'}</div></div>
                        <div className="col-span-2"><div className="text-[10px] font-black text-pastel-subtext uppercase">Công dụng</div><div className="font-bold">{product.details?.usage || '-'}</div></div>
                        <div className="col-span-2"><div className="text-[10px] font-black text-pastel-subtext uppercase">Hướng dẫn</div><div className="font-bold">{product.details?.description || '-'}</div></div>
                        <div><div className="text-[10px] font-black text-pastel-subtext uppercase">Độ mạnh</div><div className="font-bold">{product.details?.strength || '-'}</div></div>
                        <div><div className="text-[10px] font-black text-pastel-subtext uppercase">Số ngày dùng</div><div className="font-bold">{product.details?.daysToUse || '0'} ngày</div></div>
                      </div>
                    )}
                  </div>
                )}
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

function DetailEditor({ 
  product, 
  onSave, 
  compressionSettings, 
  setConfirmConfig 
}: { 
  product: Product, 
  brands: Brand[], 
  categories: ProductCategory[], 
  onSave: (p: Product) => void,
  compressionSettings: ImageCompressionSettings,
  setConfirmConfig: any
}) {
  const [data, setData] = useState({
    importPrice: product.details?.importPrice?.toString() || "",
    sellingPrice: product.details?.sellingPrice?.toString() || "",
    costPrice: product.details?.costPrice?.toString() || "",
    weight: product.details?.weight || "",
    usage: product.details?.usage || "",
    description: product.details?.description || "",
    strength: product.details?.strength || "",
    daysToUse: product.details?.daysToUse?.toString() || ""
  });
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToFirebase(file, 'products', compressionSettings);
        setImageUrl(url);
      } catch (error) {
        console.error("Upload fail:", error);
        alert(error instanceof Error ? error.message : "Upload ảnh thất bại!");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = () => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa ảnh sản phẩm này?",
      action: () => {
        setImageUrl("");
        setConfirmConfig(null);
      }
    });
  };

  const handleSave = () => {
    onSave({
      ...product,
      imageUrl: imageUrl || undefined,
      details: {
        importPrice: data.importPrice ? Number(data.importPrice) : undefined,
        sellingPrice: data.sellingPrice ? Number(data.sellingPrice) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        weight: data.weight || undefined,
        usage: data.usage || undefined,
        description: data.description || undefined,
        strength: data.strength || undefined,
        daysToUse: data.daysToUse ? Number(data.daysToUse) : undefined
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-amber-200">
      <div className="flex items-center gap-4 mb-2">
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "w-20 h-20 shrink-0 bg-pastel-bg rounded-2xl border-2 border-dashed border-pastel-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-amber-400 transition-colors relative group",
            isUploading && "opacity-50 cursor-wait",
            imageUrl && "border-solid border-amber-500"
          )}
        >
          {imageUrl ? (
            <div className="relative w-full h-full">
              <img src={imageUrl} alt="product" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="w-6 h-6 text-pastel-subtext mb-1" />
              <span className="text-[10px] font-black text-pastel-subtext uppercase">Thêm ảnh</span>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        <div className="flex-1">
          <h5 className="text-[10px] font-black uppercase text-pastel-subtext">Ảnh sản phẩm</h5>
          <p className="text-[11px] text-slate-500 font-bold italic">Kích thước tốt nhất là hình vuông hoặc 4:3</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Giá nhập</label>
        <input 
          type="number" 
          value={data.importPrice}
          onChange={e => setData(prev => ({ ...prev, importPrice: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Giá bán</label>
        <input 
          type="number" 
          value={data.sellingPrice}
          onChange={e => setData(prev => ({ ...prev, sellingPrice: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Giá vốn</label>
        <input 
          type="number" 
          value={data.costPrice}
          onChange={e => setData(prev => ({ ...prev, costPrice: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Trọng lượng (g)</label>
        <input 
          type="text" 
          value={data.weight}
          onChange={e => setData(prev => ({ ...prev, weight: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1 col-span-2">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Công dụng</label>
        <input 
          type="text" 
          value={data.usage}
          onChange={e => setData(prev => ({ ...prev, usage: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1 col-span-2">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Hướng dẫn</label>
        <input 
          type="text" 
          value={data.description}
          onChange={e => setData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Độ mạnh</label>
        <input 
          type="text" 
          value={data.strength}
          onChange={e => setData(prev => ({ ...prev, strength: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Số ngày dùng</label>
        <input 
          type="number" 
          value={data.daysToUse}
          onChange={e => setData(prev => ({ ...prev, daysToUse: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="col-span-full flex justify-end mt-2">
        <button 
          onClick={handleSave}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-amber-200"
        >
          <Save className="w-3.5 h-3.5" /> Lưu chi tiết
        </button>
      </div>
    </div>
  </div>
);
}
