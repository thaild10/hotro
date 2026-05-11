import React, { useState, useMemo } from "react";
import { X, Plus, Image as ImageIcon, Trash2, Pencil, ChevronLeft, ChevronRight, User } from "lucide-react";
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
}

const ITEMS_PER_PAGE = 10;

export default function CustomerManagementModal({ 
  customers, 
  onClose, 
  onUpdateCustomers,
  compressionSettings
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
        alert("Upload ảnh thất bại!");
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
        <h3 className="font-black text-lg text-rose-500 uppercase tracking-tight">Khách hàng</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        {/* Create Area */}
        <div className="bg-white p-4 rounded-3xl border border-pastel-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "w-14 h-14 rounded-2xl bg-slate-50 border-2 border-dashed border-pastel-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-rose-300 transition-colors",
                  isUploading && "opacity-50 cursor-wait"
                )}
              >
                {imageUrl ? (
                  <div className="relative w-full h-full">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded-lg shadow-md hover:scale-110 transition-transform z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <ImageIcon className="w-6 h-6 text-pastel-subtext" />
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
            <div className="flex-1 flex flex-col gap-2">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên khách hàng..."
                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-rose-200 outline-none"
              />
              <button 
                onClick={handleCreateOrUpdate}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95",
                  editingId ? "bg-amber-500 shadow-amber-100 text-white" : "bg-rose-500 shadow-rose-100 text-white"
                )}
              >
                {editingId ? "Cập nhật thông tin" : "Thêm khách hàng"}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setName(""); setImageUrl(""); }} className="text-[10px] font-black text-slate-400 uppercase text-center mt-1">Huỷ sửa</button>
              )}
            </div>
          </div>
        </div>

        {/* List Area */}
        <div className="space-y-3 pb-20">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Danh sách ({customers.length})</h4>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white border border-pastel-border disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black w-14 text-center">{currentPage} / {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white border border-pastel-border disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedCustomers.map(customer => (
              <div key={customer.id} className="bg-white p-3 rounded-2xl border border-pastel-border flex items-center justify-between group animate-in slide-in-from-right-2 duration-300 shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => customer.imageUrl && setSelectedImageUrl(customer.imageUrl)}
                    className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-pastel-border flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  >
                    {customer.imageUrl ? (
                      <img src={customer.imageUrl} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <span className="font-bold text-slate-700">{customer.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(customer)} className="p-2 text-violet-500 hover:bg-violet-50 rounded-xl transition-colors"><Pencil className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
            {paginatedCustomers.length === 0 && (
              <div className="text-center py-20 text-slate-400 italic text-sm">Chưa có khách hàng</div>
            )}
          </div>
        </div>
      </div>

      {/* Image View Overlay */}
      <AnimatePresence>
        {selectedImageUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center p-8"
            onClick={() => setSelectedImageUrl(null)}
          >
            <button className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImageUrl} alt="full" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl shadow-white/10" />
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
