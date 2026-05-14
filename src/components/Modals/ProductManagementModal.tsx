import React, { useState, useMemo } from "react";
import { X, Package, Box, Tags, Plus, Pencil, Trash2, ArrowDownAZ, ArrowUpZA, Save, Image as ImageIcon, CloudUpload } from "lucide-react";
import { motion } from "motion/react";
import { Brand, ProductCategory, Product, ImageCompressionSettings, SkinIssue, Ingredient } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { uploadToFirebase } from "../../lib/imageUtils";
import { Pagination } from "../Pagination";
import ImageCropperModal from "./ImageCropperModal";

interface ProductManagementModalProps {
  brands: Brand[];
  categories: ProductCategory[];
  skinIssues: SkinIssue[];
  mainIngredients: Ingredient[];
  products: Product[];
  onUpdateBrands: (brands: Brand[]) => void;
  onUpdateCategories: (categories: ProductCategory[]) => void;
  onUpdateSkinIssues: (skinIssues: SkinIssue[]) => void;
  onUpdateIngredients: (ingredients: Ingredient[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onClose: () => void;
  compressionSettings: ImageCompressionSettings;
  deviceView?: 'desktop' | 'mobile';
}

export default function ProductManagementModal({
  brands, categories, skinIssues, mainIngredients, products,
  onUpdateBrands, onUpdateCategories, onUpdateSkinIssues, onUpdateIngredients, onUpdateProducts,
  onClose,
  compressionSettings,
  deviceView = 'desktop'
}: ProductManagementModalProps) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3 | 4>(0);
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
          <button
            onClick={() => setActiveTab(3)}
            className={cn(
              "text-[10px] font-black px-4 py-2 rounded-xl transition-all whitespace-nowrap uppercase tracking-wider shadow-sm",
              activeTab === 3 ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-pastel-border'
            )}
          >
            4. Vấn đề da
          </button>
          <button
            onClick={() => setActiveTab(4)}
            className={cn(
              "text-[10px] font-black px-4 py-2 rounded-xl transition-all whitespace-nowrap uppercase tracking-wider shadow-sm",
              activeTab === 4 ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 border border-pastel-border'
            )}
          >
            5. Thành phần chính
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-slate-50/50">
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
            skinIssues={skinIssues}
            mainIngredients={mainIngredients}
            onUpdateProducts={onUpdateProducts} 
            setConfirmConfig={setConfirmConfig} 
            compressionSettings={compressionSettings}
          />
        )}
        {activeTab === 3 && (
          <SkinIssueTab skinIssues={skinIssues} onUpdateSkinIssues={onUpdateSkinIssues} setConfirmConfig={setConfirmConfig} />
        )}
        {activeTab === 4 && (
          <IngredientTab 
            ingredients={mainIngredients} 
            onUpdateIngredients={onUpdateIngredients} 
            setConfirmConfig={setConfirmConfig} 
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
    const newBrand: Brand = { id: `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: newName.trim() };
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
  }, [brands, sortAsc]);

  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBrands.slice(start, start + pageSize);
  }, [sortedBrands, currentPage, pageSize]);

  const totalPages = Math.ceil(brands.length / pageSize);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border shadow-sm">
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
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
            <span className="hidden sm:inline">{sortAsc ? "Từ A - Z" : "Từ Z - A"}</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-16 text-center">Số thứ tự</div>
          <div className="flex-1">Tên hãng</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {paginatedBrands.map((brand, idx) => (
            <div key={brand.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors">
              <div className="w-16 text-center text-sm font-bold text-pastel-subtext">
                {(currentPage - 1) * pageSize + idx + 1}
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
          {brands.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có hãng nào
            </div>
          )}
        </div>
        
        {brands.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalItems={brands.length}
          />
        )}
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
    const newCategory: ProductCategory = { id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: newName.trim() };
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
  }, [categories, sortAsc]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCategories.slice(start, start + pageSize);
  }, [sortedCategories, currentPage, pageSize]);

  const totalPages = Math.ceil(categories.length / pageSize);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border shadow-sm">
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
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
            <span className="hidden sm:inline">{sortAsc ? "Từ A - Z" : "Từ Z - A"}</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-16 text-center">Số thứ tự</div>
          <div className="flex-1">Tên loại</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {paginatedCategories.map((category, idx) => (
            <div key={category.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors">
              <div className="w-16 text-center text-sm font-bold text-pastel-subtext">
                {(currentPage - 1) * pageSize + idx + 1}
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
          {categories.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có loại sản phẩm nào
            </div>
          )}
        </div>
        
        {categories.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalItems={categories.length}
          />
        )}
      </div>
    </div>
  );
}

function ProductTab({ 
  products, 
  brands,
  categories,
  skinIssues,
  mainIngredients,
  onUpdateProducts, 
  setConfirmConfig,
  compressionSettings
}: { 
  products: Product[],
  brands: Brand[],
  categories: ProductCategory[],
  skinIssues: SkinIssue[],
  mainIngredients: Ingredient[],
  onUpdateProducts: (p: Product[]) => void, 
  setConfirmConfig: any,
  compressionSettings: ImageCompressionSettings
}) {
  const [sortType, setSortType] = useState<'name-asc' | 'name-desc' | 'brand-asc' | 'brand-desc'>('name-asc');
  const [newName, setNewName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterBrandSearch, setFilterBrandSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cropperData, setCropperData] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 1 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert(`Ảnh quá lớn (${(file.size / (1024 * 1024)).toFixed(2)}MB). Giới hạn tối đa là 1MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCropperData(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setIsUploading(true);
    setCropperData(null);
    try {
      const file = new File([blob], "product.jpg", { type: "image/jpeg" });
      const url = await uploadToFirebase(file, 'products', compressionSettings);
      setImageUrl(url);
    } catch (error) {
      console.error("Upload fail:", error);
      alert(error instanceof Error ? error.message : "Upload ảnh thất bại, vui lòng thử lại!");
    } finally {
      setIsUploading(false);
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
    daysToUse: "",
    mfgDate: "",
    expDate: "",
    skinIssues: [] as string[],
    mainIngredients: [] as string[]
  });

  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [editingDetailsId, setEditingDetailsId] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingBrandId, setEditingBrandId] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !selectedBrand || !selectedCategory) {
      setError("Vui lòng nhập tên, chọn hãng và loại");
      setTimeout(() => setError(null), 3000);
      return;
    }
    const newProduct: Product = { 
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
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
        daysToUse: details.daysToUse ? Number(details.daysToUse) : undefined,
        mfgDate: details.mfgDate || undefined,
        expDate: details.expDate || undefined,
        skinIssues: details.skinIssues.length > 0 ? details.skinIssues : undefined,
        mainIngredients: details.mainIngredients.length > 0 ? details.mainIngredients : undefined
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
      daysToUse: "",
      mfgDate: "",
      expDate: "",
      skinIssues: [],
      mainIngredients: []
    });
    setError(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateProducts(products.map(p => p.id === id ? { ...p, name: editName.trim(), categoryId: editingCategoryId, brandId: editingBrandId } : p));
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.id === 'prod-1778507933217') return false;
      const brand = brands.find(br => br.id === p.brandId);
      const matchBrandSearch = !filterBrandSearch || brand?.name.toLowerCase().includes(filterBrandSearch.toLowerCase());
      const matchBrand = !filterBrand || p.brandId === filterBrand;
      const matchCategory = !filterCategory || p.categoryId === filterCategory;
      const matchSearch = !filterSearch || p.name.toLowerCase().includes(filterSearch.toLowerCase());
      return matchBrand && matchCategory && matchSearch && matchBrandSearch;
    });
  }, [products, filterBrand, filterCategory, filterSearch, filterBrandSearch, brands]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortType === 'name-asc') return a.name.localeCompare(b.name);
      if (sortType === 'name-desc') return b.name.localeCompare(a.name);
      
      const brandA = brands.find(br => br.id === a.brandId)?.name || "";
      const brandB = brands.find(br => br.id === b.brandId)?.name || "";
      
      if (sortType === 'brand-asc') return brandA.localeCompare(brandB);
      if (sortType === 'brand-desc') return brandB.localeCompare(brandA);
      
      return 0;
    });
  }, [filteredProducts, sortType, brands]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y.slice(-2)}`;
  };

  return (
    <div className="flex flex-col min-h-full space-y-4 font-sans">
      {/* Search & Filter bar inner content */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border shadow-sm">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <input 
              type="text"
              value={filterSearch}
              onChange={e => { setFilterSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm theo tên sản phẩm..."
              className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
            />
          </div>
          <div className="relative">
            <input 
              type="text"
              value={filterBrandSearch}
              onChange={e => { setFilterBrandSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Nhập tên hãng..."
              className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="w-full bg-pastel-bg rounded-xl px-3 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors truncate"
          >
            <option value="">Lọc theo loại...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortType}
            onChange={e => setSortType(e.target.value as any)}
            className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
          >
            <option value="name-asc">A - Z</option>
            <option value="name-desc">Z - A</option>
            <option value="brand-asc">Hãng A - Z</option>
            <option value="brand-desc">Hãng Z - A</option>
          </select>
        </div>
      </div>

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
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={() => setShowDetailsInputs(!showDetailsInputs)}
            className="px-4 py-3 bg-white border border-amber-200 text-amber-500 rounded-xl font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <Plus className={`w-4 h-4 transition-transform ${showDetailsInputs ? 'rotate-45' : ''}`} />
            Thông tin chi tiết
          </button>
          
          <button 
            onClick={handleCreate}
            className="flex-1 sm:flex-none px-8 py-3 bg-amber-500 text-white rounded-xl font-black text-sm shadow-xl shadow-amber-200 active:scale-95 transition-all whitespace-nowrap"
          >
            Tạo
          </button>
        </div>
      </div>

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
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">SẢN XUẤT(MFG)</label>
                <input 
                  type="date" 
                  value={details.mfgDate}
                  onChange={e => setDetails(prev => ({ ...prev, mfgDate: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">HẠN SỬ DỤNG (EXP)</label>
                <input 
                  type="date" 
                  value={details.expDate}
                  onChange={e => setDetails(prev => ({ ...prev, expDate: e.target.value }))}
                  className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
                />
              </div>
              
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Vấn đề da</label>
                <div className="flex flex-wrap gap-1 bg-white p-2 rounded-lg border border-transparent focus-within:border-amber-300 min-h-[40px]">
                  {skinIssues.map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setDetails(prev => ({
                          ...prev,
                          skinIssues: prev.skinIssues.includes(issue.id) 
                            ? prev.skinIssues.filter(id => id !== issue.id)
                            : [...prev.skinIssues, issue.id]
                        }));
                      }}
                      className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors",
                        details.skinIssues.includes(issue.id) ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {issue.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Thành phần chính</label>
                <div className="flex flex-wrap gap-1 bg-white p-2 rounded-lg border border-transparent focus-within:border-amber-300 min-h-[40px]">
                  {mainIngredients.map(ing => (
                    <button
                      key={ing.id}
                      onClick={() => {
                        setDetails(prev => ({
                          ...prev,
                          mainIngredients: prev.mainIngredients.includes(ing.id) 
                            ? prev.mainIngredients.filter(id => id !== ing.id)
                            : [...prev.mainIngredients, ing.id]
                        }));
                      }}
                      className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors",
                        details.mainIngredients.includes(ing.id) ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {ing.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        
        {cropperData && (
          <ImageCropperModal 
            image={cropperData} 
            onCropComplete={handleCropComplete} 
            onCancel={() => setCropperData(null)} 
          />
        )}

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase tracking-wider">
          <div className="w-16 text-center">Số thứ tự</div>
          <div className="w-32">Hãng</div>
          <div className="flex-1">Tên sản phẩm</div>
          <div className="w-32">Loại</div>
          <div className="w-24 text-center">Thông tin</div>
          <div className="w-24 text-right pr-4">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {paginatedProducts.map((product, idx) => {
            const brand = brands.find(b => b.id === product.brandId);
            const category = categories.find(c => c.id === product.categoryId);
            const isDetailed = product.details && (product.details.importPrice || product.details.sellingPrice || product.details.usage || product.details.description);
            
            return (
              <div key={product.id} className="flex flex-col border-b border-pastel-border/30 last:border-0">
                <div className="flex items-center px-2 py-3 hover:bg-pastel-bg/50 rounded-2xl transition-colors">
                  <div className="w-16 text-center text-sm font-bold text-pastel-subtext font-mono">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </div>
                  <div className="w-32 text-[11px] font-black text-amber-600 truncate pr-4 uppercase italic">
                    {editingId === product.id ? (
                      <select
                        value={editingBrandId}
                        onChange={e => setEditingBrandId(e.target.value)}
                        className="w-full bg-white border-b-2 border-amber-500 px-1 py-1 outline-none text-[10px] font-bold"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    ) : (
                      brand?.name || '-'
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2 pr-4">
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
                        className="flex-1 bg-white border-b-2 border-amber-500 px-2 py-1 outline-none font-bold text-sm"
                      />
                    ) : (
                      <span className="font-bold text-sm text-slate-700">{product.name}</span>
                    )}
                  </div>
                  <div className="w-32 text-[10px] font-bold text-slate-400 truncate pr-4">
                    {editingId === product.id ? (
                      <select
                        value={editingCategoryId}
                        onChange={e => setEditingCategoryId(e.target.value)}
                        className="w-full bg-white border-b-2 border-amber-500 px-1 py-1 outline-none text-[10px] font-bold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      category?.name || '-'
                    )}
                  </div>
                  <div className="w-24 flex justify-center">
                    <button 
                      onClick={() => setViewDetailsId(viewDetailsId === product.id ? null : product.id)}
                      className={cn(
                        "text-[10px] font-black px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shadow-sm border",
                        isDetailed 
                          ? "bg-amber-100 text-amber-600 border-amber-200" 
                          : "bg-slate-50 text-slate-400 border-slate-200"
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
                          <Save className="w-4 h-4" />
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
                          onClick={() => { 
                            setEditingId(product.id); 
                            setEditName(product.name);
                            setEditingCategoryId(product.categoryId);
                            setEditingBrandId(product.brandId);
                          }}
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
                  <div className="p-5 bg-pastel-bg/20 rounded-2xl mx-10 mb-4 border border-pastel-border/50 animate-in zoom-in-95 duration-200 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase text-amber-600 tracking-widest">Thông tin chi tiết sản phẩm</h4>
                      </div>
                      <button 
                        onClick={() => setEditingDetailsId(editingDetailsId === product.id ? null : product.id)}
                        className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-pastel-border hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm"
                      >
                        {editingDetailsId === product.id ? "HUỶ BỎ" : "SỬA CHI TIẾT"}
                      </button>
                    </div>

                    {editingDetailsId === product.id ? (
                      <DetailEditor 
                        product={product} 
                        skinIssues={skinIssues}
                        mainIngredients={mainIngredients}
                        compressionSettings={compressionSettings}
                        setConfirmConfig={setConfirmConfig}
                        onSave={(updatedProduct) => {
                          onUpdateProducts(products.map(p => p.id === product.id ? updatedProduct : p));
                          setEditingDetailsId(null);
                        }} 
                      />
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">Giá nhập</div><div className="font-black text-slate-700">{product.details?.importPrice?.toLocaleString() || '0'}đ</div></div>
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">Giá bán</div><div className="font-black text-amber-600">{product.details?.sellingPrice?.toLocaleString() || '0'}đ</div></div>
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">Giá vốn</div><div className="font-black text-slate-700">{product.details?.costPrice?.toLocaleString() || '0'}đ</div></div>
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">Trọng lượng</div><div className="font-black text-slate-700">{product.details?.weight || '-'}</div></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                          <div className="bg-white p-4 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-2">Công dụng</div><div className="font-bold text-slate-600 leading-relaxed">{product.details?.usage || '-'}</div></div>
                          <div className="bg-white p-4 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-2">Hướng dẫn</div><div className="font-bold text-slate-600 leading-relaxed">{product.details?.description || '-'}</div></div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">Độ mạnh</div><div className="font-black text-slate-700">{product.details?.strength || '-'}</div></div>
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">Số ngày dùng</div><div className="font-black text-slate-700 font-mono tracking-tighter">{product.details?.daysToUse || '0'} ngày</div></div>
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">SẢN XUẤT (MFG)</div><div className="font-black text-slate-700 font-mono tracking-tighter">{formatDate(product.details?.mfgDate)}</div></div>
                          <div className="bg-white p-3 rounded-xl border border-pastel-border/50 shadow-sm"><div className="text-[10px] font-black text-pastel-subtext uppercase mb-1">HẠN SỬ DỤNG (EXP)</div><div className="font-black text-rose-500 font-mono tracking-tighter">{formatDate(product.details?.expDate)}</div></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-pastel-border/50 shadow-sm">
                            <div className="text-[10px] font-black text-pastel-subtext uppercase mb-2">Vấn đề da</div>
                            <div className="flex flex-wrap gap-1">
                              {product.details?.skinIssues && product.details.skinIssues.length > 0 ? (
                                product.details.skinIssues.map(id => {
                                  const issue = skinIssues.find(s => s.id === id);
                                  return issue ? <span key={id} className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg border border-amber-100">{issue.name}</span> : null;
                                })
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300">Chưa chọn</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-pastel-border/50 shadow-sm">
                            <div className="text-[10px] font-black text-pastel-subtext uppercase mb-2">Thành phần chính</div>
                            <div className="flex flex-wrap gap-1">
                              {product.details?.mainIngredients && product.details.mainIngredients.length > 0 ? (
                                product.details.mainIngredients.map(id => {
                                  const ing = mainIngredients.find(i => i.id === id);
                                  return ing ? <span key={id} className="text-[9px] font-black bg-sky-50 text-sky-600 px-2 py-1 rounded-lg border border-sky-100">{ing.name}</span> : null;
                                })
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300">Chưa chọn</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-20 bg-slate-50/30">
              Chưa có sản phẩm nào phù hợp với bộ lọc
            </div>
          )}
        </div>
        
        {filteredProducts.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalItems={filteredProducts.length}
          />
        )}
      </div>
    </div>
  );
}

function DetailEditor({ 
  product, 
  skinIssues,
  mainIngredients,
  onSave, 
  compressionSettings, 
  setConfirmConfig 
}: { 
  product: Product, 
  skinIssues: SkinIssue[],
  mainIngredients: Ingredient[],
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
    daysToUse: product.details?.daysToUse?.toString() || "",
    mfgDate: product.details?.mfgDate || "",
    expDate: product.details?.expDate || "",
    skinIssues: product.details?.skinIssues || [] as string[],
    mainIngredients: product.details?.mainIngredients || [] as string[],
    categoryId: product.categoryId || "",
    brandId: product.brandId || ""
  });
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [cropperData, setCropperData] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperData(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setIsUploading(true);
    setCropperData(null);
    try {
      const file = new File([blob], "product.jpg", { type: "image/jpeg" });
      const url = await uploadToFirebase(file, 'products', compressionSettings);
      setImageUrl(url);
    } catch (error) {
      console.error("Upload fail:", error);
      alert(error instanceof Error ? error.message : "Upload ảnh thất bại, vui lòng thử lại!");
    } finally {
      setIsUploading(false);
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
      categoryId: data.categoryId || product.categoryId,
      brandId: data.brandId || product.brandId,
      typeId: data.categoryId || product.typeId, // Sync typeId with categoryId
      details: {
        importPrice: data.importPrice ? Number(data.importPrice) : undefined,
        sellingPrice: data.sellingPrice ? Number(data.sellingPrice) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        weight: data.weight || undefined,
        usage: data.usage || undefined,
        description: data.description || undefined,
        strength: data.strength || undefined,
        daysToUse: data.daysToUse ? Number(data.daysToUse) : undefined,
        mfgDate: data.mfgDate || undefined,
        expDate: data.expDate || undefined,
        skinIssues: data.skinIssues.length > 0 ? data.skinIssues : undefined,
        mainIngredients: data.mainIngredients.length > 0 ? data.mainIngredients : undefined
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
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">SẢN XUẤT(MFG)</label>
        <input 
          type="date" 
          value={data.mfgDate}
          onChange={e => setData(prev => ({ ...prev, mfgDate: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">HẠN SỬ DỤNG (EXP)</label>
        <input 
          type="date" 
          value={data.expDate}
          onChange={e => setData(prev => ({ ...prev, expDate: e.target.value }))}
          className="w-full bg-pastel-bg rounded-lg px-3 py-2 text-xs font-bold outline-none border border-transparent focus:border-amber-300" 
        />
      </div>

      <div className="space-y-1 col-span-2">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Vấn đề da</label>
        <div className="flex flex-wrap gap-1 bg-pastel-bg p-2 rounded-lg border border-transparent focus-within:border-amber-300 min-h-[40px]">
          {skinIssues.map(issue => (
            <button
              key={issue.id}
              onClick={() => {
                setData(prev => ({
                  ...prev,
                  skinIssues: prev.skinIssues.includes(issue.id) 
                    ? prev.skinIssues.filter(id => id !== issue.id)
                    : [...prev.skinIssues, issue.id]
                }));
              }}
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors",
                data.skinIssues.includes(issue.id) ? "bg-amber-500 text-white" : "bg-white text-slate-500 border border-pastel-border"
              )}
            >
              {issue.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 col-span-2">
        <label className="text-[10px] font-black uppercase text-pastel-subtext ml-1">Thành phần chính</label>
        <div className="flex flex-wrap gap-1 bg-pastel-bg p-2 rounded-lg border border-transparent focus-within:border-amber-300 min-h-[40px]">
          {mainIngredients.map(ing => (
            <button
              key={ing.id}
              onClick={() => {
                setData(prev => ({
                  ...prev,
                  mainIngredients: prev.mainIngredients.includes(ing.id) 
                    ? prev.mainIngredients.filter(id => id !== ing.id)
                    : [...prev.mainIngredients, ing.id]
                }));
              }}
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold transition-colors",
                data.mainIngredients.includes(ing.id) ? "bg-amber-500 text-white" : "bg-white text-slate-500 border border-pastel-border"
              )}
            >
              {ing.name}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-full flex justify-end mt-2">
        <button 
          onClick={handleSave}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-amber-200"
        >
          <Save className="w-3.5 h-3.5" /> Lưu chi tiết
        </button>
      </div>

      {cropperData && (
        <ImageCropperModal 
          image={cropperData} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropperData(null)} 
        />
      )}
    </div>
  </div>
);
}

// SkinIssueTab Component
function SkinIssueTab({ 
  skinIssues, 
  onUpdateSkinIssues, 
  setConfirmConfig 
}: { 
  skinIssues: SkinIssue[], 
  onUpdateSkinIssues: (c: SkinIssue[]) => void, 
  setConfirmConfig: any 
}) {
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sortedIssues = useMemo(() => {
    return [...skinIssues].sort((a, b) => 
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [skinIssues, sortAsc]);

  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedIssues.slice(start, start + pageSize);
  }, [sortedIssues, currentPage, pageSize]);

  const totalPages = Math.ceil(skinIssues.length / pageSize);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newIssue: SkinIssue = { id: `skin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: newName.trim() };
    onUpdateSkinIssues([...skinIssues, newIssue]);
    setNewName("");
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateSkinIssues(skinIssues.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      message: `Bạn có chắc chắn muốn xóa vấn đề da "${name}"?`,
      action: () => {
        onUpdateSkinIssues(skinIssues.filter(c => c.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nhập tên vấn đề mới..."
            className="flex-1 min-w-0 bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
          />
          <button 
            onClick={handleAdd}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-transform whitespace-nowrap"
          >
            Tạo
          </button>
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-16 text-center">Số thứ tự</div>
          <div className="flex-1">Tên vấn đề da</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 border-b border-pastel-border">
          {paginatedIssues.map((issue, idx) => (
            <div key={issue.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors font-sans">
              <div className="w-16 text-center text-sm font-bold text-pastel-subtext font-mono">
                {(currentPage - 1) * pageSize + idx + 1}
              </div>
              <div className="flex-1 font-bold text-sm text-slate-700">
                {editingId === issue.id ? (
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(issue.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full bg-white border-b-2 border-amber-500 px-2 py-1 outline-none"
                  />
                ) : (
                  <span className="">{issue.name}</span>
                )}
              </div>
              <div className="w-24 flex items-center justify-end gap-1">
                {editingId === issue.id ? (
                  <>
                    <button onClick={() => handleSaveEdit(issue.id)} className="p-2 text-white bg-amber-500 rounded-lg active:scale-95">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 bg-slate-100 rounded-lg active:scale-95">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { setEditingId(issue.id); setEditName(issue.name); }}
                      className="p-2 text-amber-500 bg-amber-50 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(issue.id, issue.name)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {skinIssues.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có vấn đề da nào
            </div>
          )}
        </div>
        
        {skinIssues.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalItems={skinIssues.length}
          />
        )}
      </div>
    </div>
  );
}

// IngredientTab Component
function IngredientTab({ 
  ingredients, 
  onUpdateIngredients, 
  setConfirmConfig 
}: { 
  ingredients: Ingredient[], 
  onUpdateIngredients: (c: Ingredient[]) => void, 
  setConfirmConfig: any 
}) {
  const [sortAsc, setSortAsc] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sortedIngredients = useMemo(() => {
    return [...ingredients].sort((a, b) => 
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [ingredients, sortAsc]);

  const paginatedIngredients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedIngredients.slice(start, start + pageSize);
  }, [sortedIngredients, currentPage, pageSize]);

  const totalPages = Math.ceil(ingredients.length / pageSize);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newIngredient: Ingredient = { id: `ingr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: newName.trim() };
    onUpdateIngredients([...ingredients, newIngredient]);
    setNewName("");
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateIngredients(ingredients.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      message: `Bạn có chắc chắn muốn xóa thành phần "${name}"?`,
      action: () => {
        onUpdateIngredients(ingredients.filter(c => c.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-pastel-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nhập tên thành phần mới..."
            className="flex-1 min-w-0 bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-amber-300 transition-colors"
          />
          <button 
            onClick={handleAdd}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-transform whitespace-nowrap"
          >
            Tạo
          </button>
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-pastel-bg text-slate-600 rounded-xl font-bold active:scale-95 transition-all outline-none"
          >
            {sortAsc ? <ArrowDownAZ className="w-5 h-5 text-amber-500" /> : <ArrowUpZA className="w-5 h-5 text-amber-500" />}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
        <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
          <div className="w-16 text-center">Số thứ tự</div>
          <div className="flex-1">Tên thành phần</div>
          <div className="w-24 text-right">Thao tác</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 border-b border-pastel-border">
          {paginatedIngredients.map((ingredient, idx) => (
            <div key={ingredient.id} className="flex items-center px-2 py-2 hover:bg-pastel-bg rounded-2xl transition-colors font-sans">
              <div className="w-16 text-center text-sm font-bold text-pastel-subtext font-mono">
                {(currentPage - 1) * pageSize + idx + 1}
              </div>
              <div className="flex-1 font-bold text-sm text-slate-700">
                {editingId === ingredient.id ? (
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(ingredient.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full bg-white border-b-2 border-amber-500 px-2 py-1 outline-none"
                  />
                ) : (
                  <span className="">{ingredient.name}</span>
                )}
              </div>
              <div className="w-24 flex items-center justify-end gap-1">
                {editingId === ingredient.id ? (
                  <>
                    <button onClick={() => handleSaveEdit(ingredient.id)} className="p-2 text-white bg-amber-500 rounded-lg active:scale-95">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 bg-slate-100 rounded-lg active:scale-95">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { setEditingId(ingredient.id); setEditName(ingredient.name); }}
                      className="p-2 text-amber-500 bg-amber-50 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ingredient.id, ingredient.name)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {ingredients.length === 0 && (
            <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm py-10">
              Chưa có thành phần nào
            </div>
          )}
        </div>
        
        {ingredients.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalItems={ingredients.length}
          />
        )}
      </div>
    </div>
  );
}
