import React, { useState, useMemo } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Pencil, 
  Save, 
  Search, 
  Package, 
  Building, 
  AlertCircle,
  Truck,
  PlusCircle,
  Banknote,
  Percent,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ImportOrder, 
  ImportItem, 
  Supplier, 
  Product, 
  LedgerTransaction, 
  LedgerPurpose,
  LedgerAccount
} from "../../types";
import { cn, getTodayIso, formatIsoToPretty } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "../Pagination";

interface ImportManagementModalProps {
  importOrders: ImportOrder[];
  suppliers: Supplier[];
  products: Product[];
  ledgerTransactions: LedgerTransaction[];
  ledgerPurposes: LedgerPurpose[];
  ledgerAccounts: LedgerAccount[];
  onUpdateImportOrders: (orders: ImportOrder[]) => void;
  onUpdateTransactions: (transactions: LedgerTransaction[]) => void;
  onClose: () => void;
  deviceView?: 'desktop' | 'mobile';
}

export default function ImportManagementModal({
  importOrders,
  suppliers,
  products,
  ledgerTransactions,
  ledgerPurposes,
  ledgerAccounts,
  onUpdateImportOrders,
  onUpdateTransactions,
  onClose,
  deviceView = 'desktop'
}: ImportManagementModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedImportOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return importOrders.slice(start, start + pageSize);
  }, [importOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(importOrders.length / pageSize);

  const [formState, setFormState] = useState({
    supplierId: "",
    items: [{ productId: "", quantity: 1, importPrice: 0, subtotal: 0 }]
  });

  const handleAddItem = () => {
    setFormState(prev => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, importPrice: 0, subtotal: 0 }]
    }));
  };

  const handleItemChange = (index: number, updates: Partial<ImportItem>) => {
    setFormState(prev => {
      const newItems = [...prev.items];
      const prod = products.find(p => p.id === updates.productId || (!updates.productId && newItems[index].productId === p.id));
      
      const item = { ...newItems[index], ...updates };
      
      if (updates.productId !== undefined && prod) {
        item.importPrice = prod.details?.importPrice || 0;
      }
      
      item.subtotal = item.importPrice * item.quantity;
      newItems[index] = item;
      
      if (index === newItems.length - 1 && item.productId) {
        newItems.push({ productId: "", quantity: 1, importPrice: 0, subtotal: 0 });
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formState.items.length === 1) return;
    setFormState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const totalAmount = useMemo(() => {
    return formState.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [formState.items]);

  const handleSave = () => {
    const validItems = formState.items.filter(item => item.productId && item.quantity > 0);
    if (!formState.supplierId || validItems.length === 0) return;

    setConfirmConfig({
      message: editingId ? "Xác nhận cập nhật phiếu nhập hàng?" : "Xác nhận tạo phiếu nhập hàng mới?",
      action: async () => {
        const orderId = editingId || `imp-${Date.now()}`;
        const chiPurpose = ledgerPurposes.find(p => p.name === 'Chi' || p.type === 'Chi');
        const defaultAccount = ledgerAccounts[0];

        if (!chiPurpose || !defaultAccount) {
          alert("Lỗi: Không tìm thấy mục đích 'Chi' hoặc tài khoản hợp lệ.");
          return;
        }

        const date = getTodayIso();
        const transaction: LedgerTransaction = {
          id: `tx-imp-${orderId}`,
          accountId: defaultAccount.id,
          purposeId: chiPurpose.id,
          amount: totalAmount,
          date,
          reason: `Nhập hàng #${orderId.slice(-6).toUpperCase()}`,
          type: 'Chi',
          createdAt: Date.now()
        };

        const newOrder: ImportOrder = {
          id: orderId,
          supplierId: formState.supplierId,
          items: validItems,
          totalAmount,
          date,
          createdAt: Date.now(),
          transactionId: transaction.id
        };

        if (editingId) {
          onUpdateImportOrders(importOrders.map(o => o.id === editingId ? newOrder : o));
          onUpdateTransactions(ledgerTransactions.map(t => t.id === `tx-imp-${editingId}` ? transaction : t));
        } else {
          onUpdateImportOrders([newOrder, ...importOrders]);
          onUpdateTransactions([transaction, ...ledgerTransactions]);
        }

        setShowForm(false);
        setEditingId(null);
        setFormState({
          supplierId: "",
          items: [{ productId: "", quantity: 1, importPrice: 0, subtotal: 0 }]
        });
      }
    });
  };

  const handleEdit = (order: ImportOrder) => {
    setFormState({
      supplierId: order.supplierId,
      items: [...order.items, { productId: "", quantity: 1, importPrice: 0, subtotal: 0 }]
    });
    setEditingId(order.id);
    setShowForm(true);
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
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Nhập hàng</h2>
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Quản lý kho hàng</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-100 flex items-center gap-2 active:scale-95 transition-all border-b-4 border-amber-800"
            >
              <Plus className="w-4 h-4" /> NHẬP HÀNG MỚI
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
        {/* Create Area Toggle is partially handled above in header for this specific view */}

        {/* Create Area Form (Accordion) */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100 shadow-inner overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  {editingId ? "Cập nhật phiếu nhập" : "Tạo phiếu nhập mới"}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 text-amber-300 hover:text-amber-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Supplier Selection */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 block">Nhà cung cấp</label>
                  <select 
                    value={formState.supplierId}
                    onChange={(e) => setFormState(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full bg-white border border-amber-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all shadow-sm"
                  >
                    <option value="">-- Chọn nhà cung cấp --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>

                  <div className="p-6 bg-white border border-amber-100 rounded-[24px] shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-pastel-subtext">
                      <span>Loại SP:</span>
                      <span className="font-black text-slate-700">{formState.items.filter(i => i.productId).length}</span>
                    </div>
                    <div className="pt-3 border-t border-amber-100 border-dashed flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800 uppercase">Tổng tiền:</span>
                      <span className="text-lg font-black text-amber-600">{totalAmount.toLocaleString()}đ</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={!formState.supplierId || formState.items.filter(i => i.productId).length === 0}
                    className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-100 flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-amber-800 disabled:opacity-50 disabled:grayscale"
                  >
                    <CheckCircle2 className="w-5 h-5" /> HOÀN TẤT
                  </button>
                </div>

                {/* Items List */}
                <div className="lg:col-span-2 space-y-3">
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 block">Danh sách sản phẩm</label>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {formState.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-white border border-amber-100 rounded-2xl relative group shadow-sm">
                        <div className="col-span-12 md:col-span-6">
                          <label className="text-[9px] font-black text-amber-300 uppercase tracking-widest mb-1.5 ml-1 block">Sản phẩm</label>
                          <select 
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, { productId: e.target.value })}
                            className="w-full bg-amber-50/30 border border-amber-50 rounded-xl p-2.5 text-[11px] font-bold outline-none focus:border-amber-400"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] font-black text-amber-300 uppercase tracking-widest mb-1.5 ml-1 block">SL</label>
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, { quantity: parseInt(e.target.value) || 0 })}
                            className="w-full bg-amber-50/30 border border-amber-50 rounded-xl p-2.5 text-[11px] font-bold text-center outline-none"
                            min="1"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] font-black text-amber-300 uppercase tracking-widest mb-1.5 ml-1 block">Giá nhập</label>
                          <input 
                            type="text"
                            value={item.importPrice.toLocaleString()}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                              handleItemChange(index, { importPrice: val });
                            }}
                            className="w-full bg-amber-50/30 border border-amber-50 rounded-xl p-2.5 text-[11px] font-bold outline-none"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] font-black text-amber-300 uppercase tracking-widest mb-1.5 ml-1 block">Tổng</label>
                          <div className="w-full bg-white border border-amber-50 rounded-xl p-2.5 text-[11px] font-black text-amber-600 truncate">
                            {item.subtotal.toLocaleString()}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(index)}
                          className="absolute -right-1 top-1/2 -translate-y-1/2 p-1.5 bg-rose-50 text-rose-500 rounded-lg shadow-sm border border-rose-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleAddItem}
                    className="w-full py-3 border-2 border-dashed border-amber-200 rounded-2xl text-amber-400 font-bold text-[10px] uppercase tracking-widest hover:border-amber-400 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm sản phẩm
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List Area */}
        <div className="flex-1 bg-white border border-pastel-border rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0">
            <div className="w-10 text-center">STT</div>
            <div className="flex-1">Mã phiếu & Đối tác</div>
            <div className="w-32 text-center">Tổng tiền</div>
            <div className="w-24 text-right">Thao tác</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {paginatedImportOrders.map((order, index) => {
              const sup = suppliers.find(s => s.id === order.supplierId);
              return (
                <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-amber-50/20 border-b border-pastel-border/30 last:border-0 transition-colors">
                  <span className="text-xs font-black text-pastel-subtext w-10 text-center">
                    {(currentPage - 1) * pageSize + index + 1}
                  </span>
                  
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pastel-bg flex items-center justify-center shrink-0 border border-pastel-border shadow-sm">
                      <Truck className="w-6 h-6 text-pastel-subtext/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[9px] font-black rounded-md uppercase">#{order.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-pastel-subtext">{formatIsoToPretty(order.date)}</span>
                      </div>
                      <span className="block font-black text-sm text-slate-700 truncate">{sup?.name || "N/A"}</span>
                    </div>
                    <div className="w-32 text-center">
                      <span className="font-black text-sm text-amber-600">{(order.totalAmount).toLocaleString()}đ</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 justify-end w-24">
                      <button 
                        onClick={() => handleEdit(order)}
                        className="p-2.5 text-amber-500 bg-white border border-amber-100 rounded-xl shadow-sm hover:bg-amber-50 active:scale-90 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {importOrders.length === 0 && (
              <div className="h-60 flex flex-col items-center justify-center text-pastel-subtext italic text-sm gap-2">
                <Truck className="w-10 h-10 opacity-20" />
                <span>Chưa có dữ liệu nhập hàng</span>
              </div>
            )}
            
            {importOrders.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                totalItems={importOrders.length}
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
