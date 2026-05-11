import React, { useState } from "react";
import { X, Package, Box, Tags, Plus, Pencil, Trash2, ArrowDownAZ, ArrowUpZA, Save, Image as ImageIcon, CloudUpload, ChevronLeft } from "lucide-react";
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
}

export default function ProductManagementModal({
  brands, categories, products,
  onUpdateBrands, onUpdateCategories, onUpdateProducts,
  onClose,
  compressionSettings
}: ProductManagementModalProps) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(2); // Default to product tab
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-pastel-bg z-[1000] flex flex-col md:max-w-[430px] md:mx-auto md:border-x md:border-slate-200"
    >
      {/* Page Header */}
      <div className="bg-white px-4 h-16 flex items-center gap-3 border-b border-pastel-border shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors active:scale-95 flex items-center gap-2">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
          <span className="font-black text-slate-600 text-sm">Quay lại</span>
        </button>
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <h3 className="font-black text-lg text-amber-500 uppercase tracking-tight">Sản phẩm</h3>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 py-3 flex gap-2 border-b border-pastel-border overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveTab(0)}
          className={cn(
            "text-[11px] font-black uppercase px-4 py-2 rounded-xl transition-all whitespace-nowrap",
            activeTab === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-pastel-bg text-pastel-subtext"
          )}
        >
          Hãng
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={cn(
            "text-[11px] font-black uppercase px-4 py-2 rounded-xl transition-all whitespace-nowrap",
            activeTab === 1 ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-pastel-bg text-pastel-subtext"
          )}
        >
          Loại
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={cn(
            "text-[11px] font-black uppercase px-4 py-2 rounded-xl transition-all whitespace-nowrap",
            activeTab === 2 ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-pastel-bg text-pastel-subtext"
          )}
        >
          Sản phẩm
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-slate-50">
        {activeTab === 0 && (
          <div className="p-4"><BrandTab brands={brands} onUpdateBrands={onUpdateBrands} setConfirmConfig={setConfirmConfig} /></div>
        )}
        {activeTab === 1 && (
          <div className="p-4"><CategoryTab categories={categories} onUpdateCategories={onUpdateCategories} setConfirmConfig={setConfirmConfig} /></div>
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

function BrandTab({ brands, onUpdateBrands, setConfirmConfig }: any) {
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

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Xóa hãng này?",
      action: () => {
        onUpdateBrands(brands.filter((b: any) => b.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const sorted = [...brands].sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-2xl border border-pastel-border flex gap-2">
        <input 
          placeholder="Tên hãng..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 bg-pastel-bg rounded-xl px-4 py-2 text-sm font-bold outline-none"
        />
        <button onClick={handleCreate} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold">Thêm</button>
      </div>
      <div className="space-y-2">
        {sorted.map(b => (
          <div key={b.id} className="bg-white p-3 rounded-2xl border border-pastel-border flex items-center justify-between">
            {editingId === b.id ? (
              <input 
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => {
                  if (editName.trim()) onUpdateBrands(brands.map((x: any) => x.id === b.id ? { ...x, name: editName } : x));
                  setEditingId(null);
                }}
                className="font-bold text-slate-700 outline-none border-b-2 border-amber-500"
              />
            ) : (
              <span className="font-bold text-slate-700">{b.name}</span>
            )}
            <div className="flex gap-1">
              <button onClick={() => { setEditingId(b.id); setEditName(b.name); }} className="p-2 text-violet-500"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(b.id)} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTab({ categories, onUpdateCategories, setConfirmConfig }: any) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newCat = { id: `cat-${Date.now()}`, name: newName.trim() };
    onUpdateCategories([...categories, newCat]);
    setNewName("");
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Xóa loại này?",
      action: () => {
        onUpdateCategories(categories.filter((c: any) => c.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-2xl border border-pastel-border flex gap-2">
        <input 
          placeholder="Tên loại..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 bg-pastel-bg rounded-xl px-4 py-2 text-sm font-bold outline-none"
        />
        <button onClick={handleCreate} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold">Thêm</button>
      </div>
      <div className="space-y-2">
        {categories.map((c: any) => (
          <div key={c.id} className="bg-white p-3 rounded-2xl border border-pastel-border flex items-center justify-between">
            {editingId === c.id ? (
              <input 
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => {
                  if (editName.trim()) onUpdateCategories(categories.map((x: any) => x.id === c.id ? { ...x, name: editName } : x));
                  setEditingId(null);
                }}
                className="font-bold text-slate-700 outline-none border-b-2 border-amber-500"
              />
            ) : (
              <span className="font-bold text-slate-700">{c.name}</span>
            )}
            <div className="flex gap-1">
              <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="p-2 text-violet-500"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductTab({ products, brands, categories, onUpdateProducts, setConfirmConfig, compressionSettings }: any) {
  const [newName, setNewName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState<any>({});
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToFirebase(file, 'products', compressionSettings);
        setImageUrl(url);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCreate = () => {
    if (!newName.trim() || !selectedBrand || !selectedCategory) return;
    const newProd = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      brandId: selectedBrand,
      categoryId: selectedCategory,
      imageUrl: imageUrl || undefined,
      details: { ...details }
    };
    onUpdateProducts([...products, newProd]);
    setNewName("");
    setImageUrl("");
    setDetails({});
    setShowDetails(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b border-pastel-border space-y-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div onClick={() => fileInputRef.current?.click()} className={cn("w-14 h-14 rounded-2xl bg-pastel-bg border-2 border-dashed border-pastel-border flex items-center justify-center overflow-hidden cursor-pointer", isUploading && "opacity-50")}>
            {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-pastel-subtext" />}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>
          <div className="flex-1 space-y-2">
            <input 
              placeholder="Tên sản phẩm..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-pastel-bg rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
            />
            <div className="flex gap-2">
              <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="flex-1 bg-pastel-bg rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="">Hãng</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="flex-1 bg-pastel-bg rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="">Loại</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setShowDetails(!showDetails)} className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
            <Plus className={cn("w-3 h-3 transition-transform", showDetails && "rotate-45")} />
            Chi tiết {Object.keys(details).length > 0 && `(${Object.keys(details).length})`}
          </button>
          <button onClick={handleCreate} className="bg-amber-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-100">Tạo mới</button>
        </div>
        {showDetails && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <input placeholder="Giá nhập" type="number" onChange={e => setDetails({ ...details, importPrice: e.target.value })} className="bg-slate-50 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            <input placeholder="Giá bán" type="number" onChange={e => setDetails({ ...details, sellingPrice: e.target.value })} className="bg-slate-50 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            <input placeholder="Trọng lượng" onChange={e => setDetails({ ...details, weight: e.target.value })} className="bg-slate-50 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            <input placeholder="Độ mạnh" onChange={e => setDetails({ ...details, strength: e.target.value })} className="bg-slate-50 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 pb-24">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Danh sách ({products.length})</h4>
        {products.map((p: any) => (
          <div key={p.id} className="bg-white p-3 rounded-2xl border border-pastel-border shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pastel-bg overflow-hidden border border-pastel-border flex items-center justify-center">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-200" />}
                </div>
                <div>
                  <div className="font-bold text-slate-700 text-sm">{p.name}</div>
                  <div className="text-[10px] font-bold text-pastel-subtext uppercase">
                    {brands.find((b: any) => b.id === p.brandId)?.name} • {categories.find((c: any) => c.id === p.categoryId)?.name}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingDetailsId(editingDetailsId === p.id ? null : p.id)}
                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setConfirmConfig({
                      message: "Xóa sản phẩm này?",
                      action: () => {
                        onUpdateProducts(products.filter((x: any) => x.id !== p.id));
                        setConfirmConfig(null);
                      }
                    });
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {editingDetailsId === p.id && (
              <DetailEditor 
                product={p} 
                brands={brands} 
                categories={categories} 
                compressionSettings={compressionSettings}
                setConfirmConfig={setConfirmConfig}
                onSave={(updated: any) => {
                  onUpdateProducts(products.map((x: any) => x.id === p.id ? updated : x));
                  setEditingDetailsId(null);
                }} 
              />
            )}
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center py-20 text-slate-400 italic text-sm">Chưa có sản phẩm</div>
        )}
      </div>
    </div>
  );
}

function DetailEditor({ product, onSave, compressionSettings, setConfirmConfig }: any) {
  const [data, setData] = useState({ ...product.details });
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToFirebase(file, 'products', compressionSettings);
        setImageUrl(url);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="bg-pastel-bg/30 p-3 rounded-xl border border-amber-100 space-y-3">
      <div className="flex items-center gap-3">
        <div onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-lg bg-white border-2 border-dashed border-pastel-border flex items-center justify-center overflow-hidden cursor-pointer relative group">
          {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-pastel-subtext" />}
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input placeholder="Giá nhập" type="number" value={data.importPrice} onChange={e => setData({ ...data, importPrice: e.target.value })} className="bg-white rounded-lg px-2 py-1 text-[11px] font-bold outline-none" />
          <input placeholder="Giá bán" type="number" value={data.sellingPrice} onChange={e => setData({ ...data, sellingPrice: e.target.value })} className="bg-white rounded-lg px-2 py-1 text-[11px] font-bold outline-none" />
        </div>
      </div>
      <button onClick={() => onSave({ ...product, imageUrl, details: data })} className="w-full py-2 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Lưu thay đổi</button>
    </div>
  );
}
