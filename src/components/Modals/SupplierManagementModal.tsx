import React, { useState, useRef, useMemo } from "react";
import { X, Plus, Trash2, Pencil, Save, Building, Phone, Image as ImageIcon, CloudUpload, Monitor, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Supplier, ImageCompressionSettings } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "../Pagination";
import { uploadToFirebase } from "../../lib/imageUtils";

interface SupplierManagementModalProps {
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onClose: () => void;
  compressionSettings: ImageCompressionSettings;
  deviceView?: 'desktop' | 'mobile';
}

export default function SupplierManagementModal({
  suppliers,
  onUpdateSuppliers,
  onClose,
  compressionSettings,
  deviceView = 'desktop'
}: SupplierManagementModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return suppliers.slice(start, start + pageSize);
  }, [suppliers, currentPage, pageSize]);

  const totalPages = Math.ceil(suppliers.length / pageSize);

  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    accountNumber: "",
    imageUrl: ""
  });

  const handleCreateOrUpdate = () => {
    if (!formState.name.trim()) return;

    if (editingId) {
      onUpdateSuppliers(suppliers.map(s => s.id === editingId ? { ...s, ...formState } : s));
      setEditingId(null);
    } else {
      onUpdateSuppliers([{ id: `sup-${Date.now()}`, ...formState }, ...suppliers]);
    }
    setFormState({ name: "", phone: "", accountNumber: "", imageUrl: "" });
    setShowForm(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormState({
      name: supplier.name,
      phone: supplier.phone || "",
      accountNumber: supplier.accountNumber || "",
      imageUrl: supplier.imageUrl || ""
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      message: `Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`,
      action: () => {
        onUpdateSuppliers(suppliers.filter(s => s.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToFirebase(file, 'products', compressionSettings);
        setFormState(prev => ({ ...prev, imageUrl: url }));
      } catch (error) {
        console.error("Upload fail:", error);
        alert(error instanceof Error ? error.message : "Upload ảnh thất bại!");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

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
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-100">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Nhà cung cấp</h2>
              <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Đối tác & Liên hệ</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-100 flex items-center gap-2 active:scale-95 transition-all border-b-4 border-orange-700"
            >
              <Plus className="w-4 h-4" /> THÊM NCC
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
        {/* Create Area Toggle */}
        {!showForm && (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowForm(true)}
              className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-orange-600/10"
            >
              <Plus className="w-5 h-5 stroke-[3]" /> THÊM NHÀ CUNG CẤP MỚI
            </button>
          </div>
        )}

        {/* Create Area Form */}
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 shadow-inner overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-orange-300 uppercase tracking-widest">
                {editingId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); setFormState({ name: "", phone: "", accountNumber: "", imageUrl: "" }); }} className="p-2 text-orange-300 hover:text-orange-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-orange-100 flex items-center justify-center cursor-pointer overflow-hidden hover:border-orange-400 transition-all",
                    isUploading && "opacity-50 cursor-wait",
                    formState.imageUrl && "border-solid border-orange-500 shadow-md"
                  )}
                >
                  {formState.imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={formState.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFormState(prev => ({ ...prev, imageUrl: "" })); }}
                        className="absolute top-1 right-1 p-1 bg-orange-500 text-white rounded-lg shadow-md hover:scale-110 transition-transform z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <ImageIcon className="w-6 h-6 text-orange-200" />
                      <span className="text-[8px] font-black text-orange-200 uppercase tracking-tighter">QR / Logo</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tên nhà cung cấp..."
                    className="flex-1 bg-white border border-orange-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm"
                  />
                  <input 
                    type="text" 
                    value={formState.phone}
                    onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Số điện thoại..."
                    className="w-full md:w-1/3 bg-white border border-orange-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm"
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    value={formState.accountNumber}
                    onChange={(e) => setFormState(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Số tài khoản / Ngân hàng..."
                    className="flex-1 bg-white border border-orange-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleCreateOrUpdate}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black text-xs shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-orange-600/10"
                  >
                    <Save className="w-4 h-4" /> {editingId ? "Cập nhật" : "Lưu đối tác"}
                  </button>
                  <button 
                    onClick={() => { setShowForm(false); setEditingId(null); setFormState({ name: "", phone: "", accountNumber: "", imageUrl: "" }); }}
                    className="px-6 bg-white border border-orange-100 text-orange-400 rounded-xl font-bold text-xs active:scale-95 transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* List Area */}
        <div className="flex-1 bg-white border border-pastel-border rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0">
            <div className="w-10 text-center">STT</div>
            <div className="flex-1">Thông tin nhà cung cấp</div>
            <div className="w-32 text-center">Liên hệ</div>
            <div className="w-24 text-right">Thao tác</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {paginatedSuppliers.map((sup, index) => (
              <div key={sup.id} className="flex items-center gap-4 p-4 hover:bg-orange-50/20 border-b border-pastel-border/30 last:border-0 transition-colors">
                <span className="text-xs font-black text-pastel-subtext w-10 text-center">
                  {(currentPage - 1) * pageSize + index + 1}
                </span>
                
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pastel-bg overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                    {sup.imageUrl ? (
                      <img src={sup.imageUrl} alt={sup.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-pastel-subtext/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-black text-sm text-slate-700 truncate">{sup.name}</span>
                    {sup.accountNumber && (
                      <span className="block text-[10px] text-pastel-subtext font-bold truncate mt-0.5">
                        TK: {sup.accountNumber}
                      </span>
                    )}
                  </div>
                  <div className="w-32 text-center">
                    <span className="text-xs font-bold text-slate-600 block">{sup.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 justify-end w-24">
                    <button 
                      onClick={() => handleEdit(sup)}
                      className="p-2.5 text-orange-500 bg-white border border-orange-100 rounded-xl shadow-sm hover:bg-orange-50 active:scale-90 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(sup.id, sup.name)}
                      className="p-2.5 text-rose-500 bg-white border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="h-60 flex flex-col items-center justify-center text-pastel-subtext italic text-sm gap-2">
                <Building className="w-10 h-10 opacity-20" />
                <span>Chưa có nhà cung cấp nào</span>
              </div>
            )}
            
            {suppliers.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                totalItems={suppliers.length}
              />
            )}
          </div>
        </div>
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
