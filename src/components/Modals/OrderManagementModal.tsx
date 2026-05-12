import React, { useState, useMemo, useEffect } from "react";
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Pencil, 
  Search, 
  Save,
  CheckCircle2,
  AlertCircle,
  Package,
  UserPlus,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Building,
  History,
  Percent,
  Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Order, 
  OrderItem, 
  Customer, 
  Product, 
  LedgerTransaction, 
  LedgerPurpose,
  LedgerAccount,
  CustomerGroup,
  ImageCompressionSettings
} from "../../types";
import { cn, getTodayIso, formatIsoToPretty } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import CustomerManagementModal from "./CustomerManagementModal";
import { VIETNAM_LOCATIONS } from "../../constants/locations";
import { Pagination } from "../Pagination";

interface OrderManagementModalProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  ledgerTransactions: LedgerTransaction[];
  ledgerPurposes: LedgerPurpose[];
  ledgerAccounts: LedgerAccount[];
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateTransactions: (transactions: LedgerTransaction[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  customerGroups: CustomerGroup[];
  onUpdateGroups: (groups: CustomerGroup[]) => void;
  onViewDebtHistory?: (id: string) => void;
  onAddCardLog?: (customerName: string, action: string) => void;
  compressionSettings: ImageCompressionSettings;
  onClose: () => void;
  deviceView?: 'desktop' | 'mobile';
  isPage?: boolean;
}

export default function OrderManagementModal({
  orders,
  customers,
  products,
  ledgerTransactions,
  ledgerPurposes,
  ledgerAccounts,
  onUpdateOrders,
  onUpdateTransactions,
  onUpdateCustomers,
  customerGroups,
  onUpdateGroups,
  onViewDebtHistory,
  onAddCardLog,
  compressionSettings,
  onClose,
  deviceView = 'desktop',
  isPage = false
}: OrderManagementModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage, pageSize]);

  const totalPages = Math.ceil(orders.length / pageSize);

  // Autocomplete state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Form state
  const [formState, setFormState] = useState<{
    customerId: string;
    items: (OrderItem & { discountType: 'amount' | 'percent', discountValue: number })[];
    city: string;
    district: string;
    address: string;
  }>({
    customerId: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }],
    city: "",
    district: "",
    address: ""
  });

  const customerSuggestions = useMemo(() => {
    if (customerSearch.length < 3) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === formState.customerId), 
    [customers, formState.customerId]
  );

  const handleSelectCustomer = (cust: Customer) => {
    setFormState(prev => ({ ...prev, customerId: cust.id }));
    setCustomerSearch(cust.name);
    setShowCustomerSuggestions(false);
  };

  // Sync address when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setFormState(prev => ({
        ...prev,
        city: selectedCustomer.city || prev.city,
        district: selectedCustomer.district || prev.district,
        address: selectedCustomer.address || prev.address
      }));
      setCustomerSearch(selectedCustomer.name);
    }
  }, [selectedCustomer]);

  const handleAddItem = () => {
    setFormState(prev => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }]
    }));
  };

  const handleItemChange = (index: number, updates: Partial<OrderItem & { discountType: 'amount' | 'percent', discountValue: number }>) => {
    setFormState(prev => {
      const newItems = [...prev.items];
      const product = products.find(p => p.id === updates.productId || (updates.productId === undefined && newItems[index].productId === p.id));
      
      const item = { ...newItems[index], ...updates };
      
      // If product changed, auto-fill price
      if (updates.productId !== undefined && product) {
        item.unitPrice = product.price || product.details?.sellingPrice || 0;
      }

      // Calculate discount amount
      if (item.discountType === 'percent') {
        item.discount = Math.round((item.unitPrice * item.quantity) * (item.discountValue / 100));
      } else {
        item.discount = item.discountValue;
      }
      
      item.subtotal = (item.unitPrice * item.quantity) - item.discount;
      newItems[index] = item;
      
      // Auto-add new row if the last item's product is filled
      if (index === newItems.length - 1 && item.productId) {
        newItems.push({ productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 });
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

  const totalAmountAfterDiscount = useMemo(() => {
    return formState.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [formState.items]);

  const handleSave = () => {
    const validItems = formState.items.filter(item => item.productId && item.quantity > 0);
    if (!formState.customerId || validItems.length === 0) return;

    setConfirmConfig({
      message: editingId ? "Xác nhận cập nhật đơn hàng?" : "Xác nhận tạo đơn hàng mới?",
      action: async () => {
        const orderId = editingId || `ord-${Date.now()}`;
        const chiPurpose = ledgerPurposes.find(p => p.name === 'Khách');
        const defaultAccount = ledgerAccounts[0];

        if (!chiPurpose || !defaultAccount) {
          alert("Lỗi: Không tìm thấy mục đích 'Khách' hoặc tài khoản hợp lệ.");
          return;
        }

        const date = getTodayIso();

        const transaction: LedgerTransaction = {
          id: `tx-ord-${orderId}`,
          accountId: defaultAccount.id,
          purposeId: chiPurpose.id,
          amount: totalAmountAfterDiscount,
          date,
          reason: `Đơn hàng #${orderId.slice(-6).toUpperCase()}`,
          type: 'Chi',
          createdAt: Date.now(),
          customerId: formState.customerId
        };

        const newOrder: Order = {
          id: orderId,
          customerId: formState.customerId,
          items: validItems.map(({ discountType, discountValue, ...rest }) => rest),
          totalAmount: totalAmountAfterDiscount,
          date,
          createdAt: Date.now(),
          city: formState.city,
          district: formState.district,
          address: formState.address,
          transactionId: transaction.id
        };

        if (editingId) {
          onUpdateOrders(orders.map(o => o.id === editingId ? newOrder : o));
          onUpdateTransactions(ledgerTransactions.map(t => t.id === `tx-ord-${editingId}` ? transaction : t));
          
          if (selectedCustomer) {
            onAddCardLog?.(selectedCustomer.name, `Cập nhật đơn hàng #${orderId.slice(-6).toUpperCase()}: ${totalAmountAfterDiscount.toLocaleString('vi-VN')}đ`);
          }
        } else {
          onUpdateOrders([newOrder, ...orders]);
          onUpdateTransactions([transaction, ...ledgerTransactions]);
          
          if (selectedCustomer) {
            onAddCardLog?.(selectedCustomer.name, `Tạo đơn hàng mới #${orderId.slice(-6).toUpperCase()}: ${totalAmountAfterDiscount.toLocaleString('vi-VN')}đ`);
          }
        }

        setShowForm(false);
        setEditingId(null);
        setCustomerSearch("");
        setFormState({
          customerId: "",
          items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }],
          city: "",
          district: "",
          address: ""
        });
      }
    });
  };

  const handleEdit = (order: Order) => {
    const cust = customers.find(c => c.id === order.customerId);
    setFormState({
      customerId: order.customerId,
      items: [...order.items.map(i => ({ ...i, discountType: 'amount' as const, discountValue: i.discount })), { productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }],
      city: order.city || "",
      district: order.district || "",
      address: order.address || ""
    });
    setCustomerSearch(cust?.name || "");
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = (orderId: string) => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa đơn hàng này? Phiếu chi tương ứng cũng sẽ bị xóa.",
      action: () => {
        onUpdateOrders(orders.filter(o => o.id !== orderId));
        onUpdateTransactions(ledgerTransactions.filter(t => t.id !== `tx-ord-${orderId}`));
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
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-100">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Đơn hàng</h2>
              <p className="text-[9px] font-bold text-sky-500 uppercase tracking-wider">Quản lý bán hàng</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-sky-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-sky-100 flex items-center gap-2 active:scale-95 transition-all border-b-4 border-sky-800"
              >
                <Plus className="w-4 h-4" /> THÊM ĐƠN
              </button>
            )}
          </div>
      </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
          {/* Create Area Toggle */}
          {!showForm && (
            <div className="flex gap-3">
              <button 
                onClick={() => setShowForm(true)}
                className="flex-1 bg-sky-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-sky-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-sky-700/10"
              >
                <Plus className="w-5 h-5 stroke-[3]" /> TẠO ĐƠN HÀNG MỚI
              </button>
            </div>
          )}

          {/* List Area */}
          <div className="flex-1 bg-white border border-pastel-border rounded-[40px] overflow-hidden flex flex-col shadow-sm">
            <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0">
              <div className="w-10 text-center">STT</div>
              <div className="flex-1 px-4">Khách hàng / Liên hệ</div>
              <div className="flex-1">Sản phẩm tiêu biểu</div>
              <div className="w-32 text-center text-rose-500">Thành tiền</div>
              <div className="w-24 text-right">Thao tác</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {paginatedOrders.map((order, idx) => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-sky-50/20 border-b border-pastel-border/30 last:border-0 transition-colors">
                    <span className="text-xs font-black text-pastel-subtext w-10 text-center">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </span>
                    
                    <div className="flex-1 flex items-center gap-4 px-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-pastel-bg flex items-center justify-center overflow-hidden border border-pastel-border shrink-0">
                        {customer?.imageUrl ? <img src={customer.imageUrl} className="w-full h-full object-cover" /> : <UserPlus className="w-5 h-5 text-pastel-subtext/20" />}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-black text-sm text-slate-700 truncate">{customer?.name || "N/A"}</span>
                        <span className="block text-[10px] text-pastel-subtext font-bold uppercase truncate">
                          {order.address ? `${order.address}, ${order.district}` : "Chưa có địa chỉ"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      {order.items.slice(0, 1).map((item, i) => {
                        const p = products.find(prod => prod.id === item.productId);
                        return (
                          <span key={i} className="block text-xs font-bold text-slate-600 truncate">• {p?.name} x{item.quantity}</span>
                        );
                      })}
                      {order.items.length > 1 && (
                        <span className="block text-[9px] font-black text-sky-500 uppercase tracking-tighter">+{order.items.length - 1} sp khác</span>
                      )}
                    </div>

                    <div className="w-32 text-center shrink-0">
                      <span className="block font-black text-sm text-slate-800">{order.totalAmount.toLocaleString()}đ</span>
                      <span className="block text-[9px] font-bold text-pastel-subtext">{formatIsoToPretty(order.date)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end w-24">
                      <button 
                        onClick={() => handleEdit(order)}
                        className="p-2.5 text-sky-500 bg-white border border-sky-100 rounded-xl shadow-sm hover:bg-sky-50 active:scale-90 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2.5 text-rose-500 bg-white border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <div className="h-60 flex flex-col items-center justify-center text-pastel-subtext italic text-sm gap-2">
                  <ShoppingCart className="w-10 h-10 opacity-20" />
                  <span>Chưa có đơn hàng nào</span>
                </div>
              )}
              
              {orders.length > 0 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  totalItems={orders.length}
                />
              )}
            </div>
          </div>
        </div>

          {/* Create/Edit Form Overlay */}
          <AnimatePresence>
            {showForm && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute inset-x-0 inset-y-0 bg-white z-50 flex flex-col"
              >
                <div className="p-6 border-b border-pastel-border bg-sky-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-100">
                      {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">
                      {editingId ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}
                    </h3>
                  </div>
                  <button 
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="w-10 h-10 rounded-xl bg-white border border-pastel-border hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Section: Info */}
                    <div className="space-y-6">
                      <div className="p-6 bg-pastel-bg/30 border border-pastel-border rounded-[32px] space-y-4">
                        <h4 className="text-[11px] font-black text-pastel-subtext uppercase tracking-[0.2em] mb-2 px-1">Thông tin khách hàng</h4>
                        
                        <div className="relative">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pastel-subtext" />
                              <input 
                                type="text"
                                placeholder="Nhập tên khách hàng (Gõ tối thiểu 3 chữ)..."
                                value={customerSearch}
                                onChange={(e) => {
                                  setCustomerSearch(e.target.value);
                                  setShowCustomerSuggestions(true);
                                  if (!e.target.value) setFormState(prev => ({ ...prev, customerId: "" }));
                                }}
                                onFocus={() => setShowCustomerSuggestions(true)}
                                className="w-full bg-white border border-pastel-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-sky-300 shadow-sm"
                              />
                            </div>
                            <button 
                              onClick={() => setShowCustomerModal(true)}
                              className="w-14 h-14 rounded-2xl bg-white border border-pastel-border flex items-center justify-center text-sky-500 hover:bg-sky-50 transition-all shadow-sm active:scale-95 shrink-0"
                              title="Tạo khách hàng mới"
                            >
                              <UserPlus className="w-6 h-6" />
                            </button>
                          </div>

                          {/* Autocomplete Suggestions */}
                          <AnimatePresence>
                            {showCustomerSuggestions && customerSuggestions.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-16 mt-2 bg-white border border-pastel-border rounded-2xl shadow-xl z-[60] overflow-hidden"
                              >
                                {customerSuggestions.map(cust => (
                                  <button
                                    key={cust.id}
                                    onClick={() => handleSelectCustomer(cust)}
                                    className="w-full px-4 py-3 text-left hover:bg-sky-50 flex items-center gap-3 transition-colors border-b border-pastel-border/30 last:border-0"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-pastel-bg flex items-center justify-center overflow-hidden">
                                      {cust.imageUrl ? <img src={cust.imageUrl} alt="" className="w-full h-full object-cover" /> : <UserPlus className="w-4 h-4 text-pastel-subtext/30" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700">{cust.name}</p>
                                      {cust.address && <p className="text-[10px] text-pastel-subtext">{cust.address}</p>}
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[32px] space-y-4">
                        <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
                          <Building className="w-4 h-4" /> Địa chỉ giao hàng
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <select 
                              value={formState.city}
                              onChange={(e) => setFormState(prev => ({ ...prev, city: e.target.value, district: "" }))}
                              className="w-full bg-white border border-amber-100 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-amber-300 shadow-sm appearance-none"
                            >
                              <option value="">Chọn Thành phố...</option>
                              {Object.keys(VIETNAM_LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300 pointer-events-none rotate-90" />
                          </div>

                          <div className="relative">
                            <select 
                              value={formState.district}
                              onChange={(e) => setFormState(prev => ({ ...prev, district: e.target.value }))}
                              disabled={!formState.city}
                              className="w-full bg-white border border-amber-100 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-amber-300 shadow-sm appearance-none disabled:opacity-50"
                            >
                              <option value="">Chọn Quận/Huyện...</option>
                              {formState.city && VIETNAM_LOCATIONS[formState.city]?.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300 pointer-events-none rotate-90" />
                          </div>
                        </div>
                        <input 
                          type="text" 
                          value={formState.address}
                          onChange={(e) => setFormState(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Số nhà, tên đường, phường/xã..."
                          className="w-full bg-white border border-amber-100 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-amber-300 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Right Section: Totals & Summary */}
                    <div className="flex flex-col gap-6">
                      <div className="p-8 bg-sky-600 rounded-[40px] text-white shadow-2xl shadow-sky-200 relative overflow-hidden flex-1">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <ShoppingCart className="w-32 h-32" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="mb-auto">
                            <span className="text-sky-100 text-[10px] font-black uppercase tracking-[0.3em]">Hóa đơn dự kiến</span>
                            <h5 className="text-3xl font-black mt-2 mb-8">
                              {totalAmountAfterDiscount.toLocaleString('vi-VN')} <span className="text-lg">đ</span>
                            </h5>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-sm font-bold border-b border-sky-400 pb-2">
                                <span className="text-sky-100">Số lượng SP:</span>
                                <span>{formState.items.filter(i => i.productId).length} loại</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-bold border-b border-sky-400 pb-2">
                                <span className="text-sky-100">Khách:</span>
                                <span className="max-w-[150px] truncate">{selectedCustomer?.name || "Chưa chọn"}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={handleSave}
                            disabled={!formState.customerId || formState.items.filter(i => i.productId).length === 0}
                            className={cn(
                              "w-full py-5 rounded-[24px] font-black text-lg transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3 mt-8",
                              !formState.customerId || formState.items.filter(i => i.productId).length === 0
                                ? "bg-sky-700/50 text-sky-400 cursor-not-allowed"
                                : "bg-white text-sky-600 hover:shadow-sky-800/20"
                            )}
                          >
                            <Save className="w-6 h-6" /> {editingId ? "CẬP NHẬT ĐƠN" : "XÁC NHẬN TẠO ĐƠN"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List - Full Width Below Info */}
                  <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[11px] font-black text-pastel-subtext uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                        <Package className="w-4 h-4" /> Danh sách sản phẩm
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {formState.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-2 rounded-2xl relative group">
                          <div className="col-span-12 md:col-span-4">
                            <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Sản phẩm</label>
                            <div className="relative">
                              <select 
                                value={item.productId}
                                onChange={(e) => handleItemChange(index, { productId: e.target.value })}
                                className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-xs font-bold outline-none focus:border-sky-300 appearance-none"
                              >
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pastel-subtext pointer-events-none rotate-90" />
                            </div>
                          </div>

                          <div className="col-span-4 md:col-span-1">
                            <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">SL</label>
                            <input 
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, { quantity: parseInt(e.target.value) || 1 })}
                              className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-xs font-bold text-center outline-none focus:border-sky-300"
                            />
                          </div>

                          <div className="col-span-8 md:col-span-2">
                            <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Đơn giá</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={item.unitPrice.toLocaleString('vi-VN')}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                  handleItemChange(index, { unitPrice: val });
                                }}
                                className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-xs font-black outline-none focus:border-sky-300"
                              />
                              <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-pastel-subtext pointer-events-none" />
                            </div>
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Ưu đãi</label>
                            <div className="flex bg-pastel-bg border border-pastel-border rounded-xl p-1">
                              <input 
                                type="number"
                                value={item.discountValue}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleItemChange(index, { discountValue: val });
                                }}
                                className="w-full bg-transparent p-2 text-xs font-bold text-rose-500 outline-none"
                                placeholder="0"
                              />
                              <div className="flex gap-1 shrink-0">
                                <button 
                                  onClick={() => handleItemChange(index, { discountType: 'amount' })}
                                  className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    item.discountType === 'amount' ? "bg-rose-500 text-white shadow-sm" : "text-pastel-subtext hover:bg-white"
                                  )}
                                  title="Giảm theo tiền"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleItemChange(index, { discountType: 'percent' })}
                                  className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    item.discountType === 'percent' ? "bg-rose-500 text-white shadow-sm" : "text-pastel-subtext hover:bg-white"
                                  )}
                                  title="Giảm theo %"
                                >
                                  <Percent className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {item.discountType === 'percent' && (
                              <span className="text-[9px] font-bold text-rose-400 mt-1 ml-1 block">
                                Giảm {item.discountValue}% ({(item.discount).toLocaleString()}đ)
                              </span>
                            )}
                          </div>

                          <div className="col-span-6 md:col-span-2">
                            <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Thành tiền</label>
                            <div className="w-full bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs font-black text-sky-600">
                              {item.subtotal.toLocaleString('vi-VN')}
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-1 flex justify-end">
                            <button 
                              onClick={() => handleRemoveItem(index)}
                              className="p-3 text-rose-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                              title="Xóa dòng"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlays */}
        {showCustomerModal && (
          <CustomerManagementModal 
            customers={customers}
            customerGroups={customerGroups}
            transactions={ledgerTransactions}
            onClose={() => setShowCustomerModal(false)}
            onUpdateCustomers={onUpdateCustomers}
            onUpdateGroups={onUpdateGroups}
            onViewDebtHistory={onViewDebtHistory || (() => {})}
            compressionSettings={compressionSettings}
            deviceView={deviceView}
          />
        )}

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
