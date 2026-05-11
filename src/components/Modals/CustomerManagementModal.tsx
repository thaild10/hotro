import React, { useState, useMemo } from "react";
import { X, Plus, Image as ImageIcon, Trash2, Pencil, ChevronLeft, ChevronRight, User, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer, ImageCompressionSettings } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { uploadToFirebase } from "../../lib/imageUtils";

interface CustomerManagementModalProps {
  customers: Customer[];
  onClose: () => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  compressionSettings: ImageCompressionSettings;
  deviceView?: 'desktop' | 'mobile';
}

const ITEMS_PER_PAGE = 10;

export default function CustomerManagementModal({ 
  customers, 
  onClose, 
  onUpdateCustomers,
  compressionSettings,
  deviceView = 'desktop'
}: CustomerManagementModalProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return customers.slice(start, start + ITEMS_PER_PAGE);
  }, [customers, currentPage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToFirebase(file, 'customers', compressionSettings);
        setImageUrl(url);
      } catch (error) {
        console.error("Upload fail:", error);
        alert(error instanceof Error ? error.message : "Upload ảnh thất bại!");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCreateOrUpdate = () => {
    if (!name.trim()) return;

    if (editingId) {
      const updated = customers.map(c => 
        c.id === editingId ? { ...c, name: name.trim(), imageUrl } : c
      );
      onUpdateCustomers(updated);
      setEditingId(null);
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: name.trim(),
        imageUrl
      };
      onUpdateCustomers([newCustomer, ...customers]);
    }
    setName("");
    setImageUrl("");
  };

  const handleEdit = (customer: Customer) => {
    setName(customer.name);
    setImageUrl(customer.imageUrl || "");
    setEditingId(customer.id);
  };

  const removeAvatar = () => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa ảnh đại diện?",
      action: () => {
        setImageUrl("");
        if (editingId) {
          const updated = customers.map(c => 
            c.id === editingId ? { ...c, imageUrl: "" } : c
          );
          onUpdateCustomers(updated);
        }
        setConfirmConfig(null);
      }
    });
  };

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa khách hàng này?",
      action: () => {
        onUpdateCustomers(customers.filter(c => c.id !== id));
        setConfirmConfig(null);
      }
    });
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
            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Khách hàng</h2>
              <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Danh sách & Thông tin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
        {/* Create Area */}
        <div className="bg-pastel-bg p-6 rounded-[32px] border border-pastel-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-pastel-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-violet-400 transition-all",
                  isUploading && "opacity-50 cursor-wait",
                  imageUrl && "border-solid border-violet-500 shadow-md"
                )}
              >
                {imageUrl ? (
                  <div className="relative w-full h-full">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg shadow-md hover:scale-110 transition-transform z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6 text-pastel-subtext" />
                    <span className="text-[8px] font-black text-pastel-subtext uppercase">Ảnh</span>
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
            <div className="flex-1 space-y-2">
              <input 
                type="text" 
                value={!editingId ? name : ''}
                onChange={(e) => {
                  if (!editingId) setName(e.target.value);
                }}
                disabled={!!editingId}
                placeholder={editingId ? "Đang cập nhật khách hàng..." : "Họ và tên khách hàng..."}
                className="w-full bg-white border border-pastel-border rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-violet-400 disabled:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
              />
              {!editingId && (
                <button 
                  onClick={handleCreateOrUpdate}
                  className="w-full bg-violet-500 text-white py-3 rounded-xl font-black text-xs shadow-xl shadow-violet-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Thêm khách hàng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 bg-white border border-pastel-border rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0">
            <div className="w-10 text-center">STT</div>
            <div className="flex-1">Thông tin khách hàng</div>
            <div className="w-24 text-right">Thao tác</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {paginatedCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-4 p-4 hover:bg-pastel-bg/30 border-b border-pastel-border/30 last:border-0 transition-colors">
                <span className="text-xs font-black text-pastel-subtext w-10 text-center">
                  {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                </span>
                
                {editingId === customer.id ? (
                  <div className="flex-1 flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <div 
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={cn(
                          "w-12 h-12 rounded-xl bg-white border-2 border-violet-400 flex items-center justify-center cursor-pointer overflow-hidden shadow-sm",
                          isUploading && "opacity-50 cursor-wait"
                        )}
                      >
                        {imageUrl ? (
                          <div className="relative w-full h-full">
                            <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded-md shadow-sm active:scale-90 transition-transform z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <ImageIcon className="w-5 h-5 text-violet-500" />
                        )}
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateOrUpdate();
                        if (e.key === 'Escape') { setEditingId(null); setName(""); setImageUrl(""); }
                      }}
                      autoFocus
                      className="flex-1 bg-white border-b-2 border-violet-500 px-2 py-2 text-sm font-black outline-none"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={handleCreateOrUpdate}
                        className="p-2.5 text-white bg-violet-500 rounded-xl shadow-lg shadow-violet-100 active:scale-90"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setEditingId(null); setName(""); setImageUrl(""); }}
                        className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      onClick={() => customer.imageUrl && setSelectedImageUrl(customer.imageUrl)}
                      className="w-12 h-12 rounded-xl bg-pastel-bg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform"
                    >
                      {customer.imageUrl ? (
                        <img src={customer.imageUrl} alt={customer.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-pastel-subtext/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-black text-sm text-slate-700 truncate">{customer.name}</span>
                      <span className="block text-[9px] font-bold text-pastel-subtext uppercase tracking-tight">Thành viên hệ thống</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-2.5 text-violet-500 bg-white border border-violet-100 rounded-xl shadow-sm hover:bg-violet-50 active:scale-90 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2.5 text-red-500 bg-white border border-red-100 rounded-xl shadow-sm hover:bg-red-50 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {customers.length === 0 && (
              <div className="h-60 flex flex-col items-center justify-center text-pastel-subtext italic text-sm gap-2">
                <User className="w-10 h-10 opacity-20" />
                <span>Chưa có khách hàng nào</span>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-pastel-bg/30 border-t border-pastel-border shrink-0 flex items-center justify-center gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 bg-white border border-pastel-border rounded-xl disabled:opacity-30 active:scale-90 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "min-w-8 h-8 px-2 rounded-lg text-[10px] font-black transition-all shadow-sm border",
                      currentPage === i + 1 ? "bg-violet-500 text-white border-violet-500" : "bg-white text-pastel-subtext border-pastel-border hover:bg-violet-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 bg-white border border-pastel-border rounded-xl disabled:opacity-30 active:scale-90 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Image View Overlay */}
      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8"
            onClick={() => setSelectedImageUrl(null)}
          >
            <button className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImageUrl} alt="full" className="max-w-full max-h-full object-contain rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>

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
