import React, { useState, useMemo } from "react";
import { X, Plus, Image as ImageIcon, Trash2, Pencil, ChevronLeft, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";

interface CustomerManagementModalProps {
  customers: Customer[];
  onClose: () => void;
  onUpdateCustomers: (customers: Customer[]) => void;
}

const ITEMS_PER_PAGE = 10;

export default function CustomerManagementModal({ 
  customers, 
  onClose, 
  onUpdateCustomers 
}: CustomerManagementModalProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return customers.slice(start, start + ITEMS_PER_PAGE);
  }, [customers, currentPage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-violet-500">Quản lý khách hàng</h3>
          <button onClick={onClose} className="p-2 bg-pastel-bg rounded-full active:scale-95 transition-transform">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Create Area */}
        <div className="bg-pastel-bg p-4 rounded-3xl border border-pastel-border mb-6">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-xl bg-white border border-pastel-border flex items-center justify-center cursor-pointer overflow-hidden group-hover:border-violet-300 transition-colors"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
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
            <input 
              type="text" 
              value={!editingId ? name : ''}
              onChange={(e) => {
                if (!editingId) setName(e.target.value);
              }}
              disabled={!!editingId}
              placeholder={editingId ? "Đang sửa khách hàng ở dưới..." : "Nhập tên khách..."}
              className="flex-1 bg-white border border-pastel-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-violet-300 disabled:bg-gray-100 disabled:opacity-50"
            />
            <button 
              onClick={handleCreateOrUpdate}
              disabled={!!editingId}
              className={cn(
                "bg-violet-500 text-white p-3 rounded-xl shadow-lg shadow-violet-100 active:scale-95 transition-transform",
                !!editingId && "opacity-50 pointer-events-none"
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
          {paginatedCustomers.map((customer, index) => (
            <div key={customer.id} className="flex items-center gap-3 p-3 bg-white border border-pastel-border rounded-2xl">
              <span className="text-xs font-bold text-pastel-subtext w-4 shrink-0">
                {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
              </span>
              
              {editingId === customer.id ? (
                <>
                  <div className="relative group shrink-0">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-lg bg-white border border-violet-300 flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
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
                    className="flex-1 bg-white border-b-2 border-violet-500 px-2 py-2 text-sm font-bold outline-none"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={handleCreateOrUpdate}
                      className="p-2 text-white bg-violet-500 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setEditingId(null); setName(""); setImageUrl(""); }}
                      className="p-2 text-slate-500 bg-slate-100 rounded-lg active:scale-95"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    onClick={() => customer.imageUrl && setSelectedImageUrl(customer.imageUrl)}
                    className="w-10 h-10 rounded-lg bg-pastel-bg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {customer.imageUrl ? (
                      <img src={customer.imageUrl} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-pastel-subtext/30" />
                    )}
                  </div>
                  <span className="flex-1 font-bold text-sm truncate">{customer.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-violet-500 bg-violet-50 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {customers.length === 0 && (
            <div className="text-center py-10 italic text-pastel-subtext text-sm">Chưa có khách hàng nào</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 bg-pastel-bg rounded-xl disabled:opacity-30 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-black transition-colors",
                    currentPage === i + 1 ? "bg-violet-500 text-white" : "bg-pastel-bg text-pastel-subtext"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 bg-pastel-bg rounded-xl disabled:opacity-30 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.div>

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
