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

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50">
        {/* List Section */}
        <div className={cn(
          "flex-1 overflow-y-auto p-6 no-scrollbar",
          showForm && "hidden lg:block"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedSuppliers.map(sup => (
              <div key={sup.id} className="group bg-white border border-pastel-border rounded-[32px] overflow-hidden hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100/50 transition-all">
                <div className="aspect-[4/3] bg-pastel-bg relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  {sup.imageUrl ? (
                    <img src={sup.imageUrl} alt={sup.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-pastel-subtext/20">
                      <Building className="w-16 h-16" />
                      <span className="text-[10px] font-black uppercase tracking-widest mt-2">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(sup)}
                      className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(sup.id, sup.name)}
                      className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black rounded-lg uppercase">NCC #{sup.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg mb-4 line-clamp-1">{sup.name}</h3>
                  <div className="space-y-3">
                    {sup.phone && (
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">{sup.phone}</span>
                      </div>
                    )}
                    {sup.accountNumber && (
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black truncate">{sup.accountNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-300 italic gap-4">
                <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center">
                  <Building className="w-10 h-10 opacity-20" />
                </div>
                <span className="font-bold">Chưa có nhà cung cấp nào</span>
              </div>
            )}
          </div>
          
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

        {/* Form Section */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-full lg:w-[450px] bg-white border-l border-pastel-border overflow-y-auto p-10 shadow-2xl relative shrink-0 no-scrollbar"
            >
              <button 
                onClick={() => { setShowForm(false); setEditingId(null); setFormState({ name: "", phone: "", accountNumber: "", imageUrl: "" }); }}
                className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-slate-50 border border-pastel-border flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-50 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="w-16 h-16 rounded-[24px] bg-orange-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-orange-100">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {editingId ? "Sửa thông tin" : "Thêm đối tác"}
                </h3>
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest mt-2 bg-orange-50 inline-block px-3 py-1 rounded-full">Thông tin nhà cung cấp</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1">Tên nhà cung cấp</label>
                  <input 
                    type="text" 
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-pastel-border rounded-2xl p-5 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white shadow-sm transition-all"
                    placeholder="VD: Công Ty Dược Mỹ Phẩm ABC..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formState.phone}
                    onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-pastel-border rounded-2xl p-5 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white shadow-sm transition-all"
                    placeholder="09xx xxx xxx"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1">Số tài khoản / Ngân hàng</label>
                  <input 
                    type="text" 
                    value={formState.accountNumber}
                    onChange={(e) => setFormState(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-pastel-border rounded-2xl p-5 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white shadow-sm transition-all"
                    placeholder="1903... - Techcombank - NGUYEN VAN A"
                  />
                </div>

                {/* Image Upload Block */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1">Hình ảnh / QR Tài khoản</label>
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={cn(
                      "w-full aspect-video bg-pastel-bg rounded-[32px] border-2 border-dashed border-pastel-border flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group relative",
                      isUploading && "animate-pulse cursor-wait",
                      formState.imageUrl ? "border-solid border-orange-500" : "hover:border-orange-400 hover:bg-orange-50/30"
                    )}
                  >
                    {formState.imageUrl ? (
                      <>
                        <img src={formState.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <CloudUpload className="w-10 h-10 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                          <ImageIcon className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-600">Nhấn để tải ảnh</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">(QR Bank, Thông tin TK...)</p>
                        </div>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleCreateOrUpdate}
                    className="w-full bg-orange-500 text-white py-6 rounded-[28px] font-black text-base shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-all border-b-8 border-orange-700"
                  >
                    <Save className="w-6 h-6" /> {editingId ? "CẬP NHẬT ĐỐI TÁC" : "LƯU ĐỐI TÁC MỚI"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
