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
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white w-full h-full rounded-[40px] border border-pastel-border shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-pastel-border flex items-center justify-between bg-pastel-bg/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nhập hàng</h2>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mt-1">Lịch sử {importOrders.length} lần nhập</p>
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

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!showForm ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto p-6 no-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedImportOrders.map(order => {
                    const sup = suppliers.find(s => s.id === order.supplierId);
                    return (
                      <div key={order.id} className="p-6 bg-white border border-pastel-border rounded-[32px] hover:border-amber-200 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest mb-1">
                              <span className="bg-amber-100 px-2 py-0.5 rounded-lg">#{order.id.slice(-6).toUpperCase()}</span>
                              <span>{formatIsoToPretty(order.date)}</span>
                            </div>
                            <h3 className="font-black text-slate-800 text-base">{sup?.name || "N/A"}</h3>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(order)} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.slice(0, 3).map((item, i) => {
                            const p = products.find(prod => prod.id === item.productId);
                            return (
                              <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span className="truncate flex-1 pr-4">• {p?.name}</span>
                                <span>x{item.quantity}</span>
                              </div>
                            );
                          })}
                          {order.items.length > 3 && (
                            <p className="text-[10px] text-pastel-subtext italic">và {order.items.length - 3} sản phẩm khác...</p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-pastel-border border-dashed flex items-center justify-between">
                          <span className="text-[10px] font-black text-pastel-subtext uppercase">Tổng tiền</span>
                          <span className="font-black text-amber-600">{(order.totalAmount).toLocaleString()}đ</span>
                        </div>
                      </div>
                    );
                  })}
                  {importOrders.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 italic gap-3">
                      <Truck className="w-12 h-12 opacity-20" />
                      <span>Chưa có lịch sử nhập hàng</span>
                    </div>
                  )}
                </div>
                
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
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-hidden flex flex-col lg:flex-row"
              >
                {/* Left side: Items */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar border-r border-pastel-border">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Danh sách sản phẩm</h3>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formState.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-pastel-bg/20 border border-pastel-border rounded-2xl relative group">
                        <div className="col-span-12 md:col-span-6">
                          <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Sản phẩm</label>
                          <select 
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, { productId: e.target.value })}
                            className="w-full bg-white border border-pastel-border rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-400 shadow-sm"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">SL</label>
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, { quantity: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white border border-pastel-border rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-400"
                            min="1"
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Giá nhập</label>
                          <input 
                            type="text"
                            value={item.importPrice.toLocaleString()}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                              handleItemChange(index, { importPrice: val });
                            }}
                            className="w-full bg-white border border-pastel-border rounded-xl p-3 text-xs font-bold outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Thành tiền</label>
                          <div className="w-full bg-white/50 border border-pastel-border rounded-xl p-3 text-xs font-black text-amber-600 truncate">
                            {item.subtotal.toLocaleString()}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRemoveItem(index)}
                          className="absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-rose-100 text-rose-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button 
                      onClick={handleAddItem}
                      className="w-full py-4 border-2 border-dashed border-pastel-border rounded-2xl text-pastel-subtext font-bold text-xs hover:border-amber-400 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" /> Thêm sản phẩm khác
                    </button>
                  </div>
                </div>

                {/* Right side: Summary */}
                <div className="w-full lg:w-96 bg-pastel-bg/30 p-8 flex flex-col">
                  <div className="mb-8">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Xác nhận nhập</h3>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1">Nhà cung cấp</label>
                      <select 
                        value={formState.supplierId}
                        onChange={(e) => setFormState(prev => ({ ...prev, supplierId: e.target.value }))}
                        className="w-full bg-white border border-pastel-border rounded-2xl p-4 text-sm font-bold outline-none focus:border-amber-400 shadow-sm"
                      >
                        <option value="">-- Chọn nhà cung cấp --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="p-6 bg-white border border-pastel-border rounded-[32px] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-pastel-subtext">Số lượng SP:</span>
                        <span className="font-black text-slate-700">{formState.items.filter(i => i.productId).length}</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-t border-pastel-border border-dashed">
                        <span className="text-sm font-black text-slate-800">TỔNG TIỀN:</span>
                        <span className="text-xl font-black text-amber-600">{totalAmount.toLocaleString()}đ</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={!formState.supplierId || formState.items.filter(i => i.productId).length === 0}
                    className="w-full bg-amber-600 text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-amber-100 flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-amber-800 disabled:opacity-50 disabled:grayscale"
                  >
                    <CheckCircle2 className="w-5 h-5" /> HOÀN TẤT NHẬP HÀNG
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
