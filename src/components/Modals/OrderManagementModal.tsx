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
  ImportOrder, 
  ImportItem, 
  Supplier, 
  Product, 
  LedgerTransaction, 
  LedgerPurpose,
  LedgerAccount,
  LedgerLog,
  CustomerGroup,
  ImageCompressionSettings,
  SkinAuditEntry,
  SkinAuditLog,
  SkinIssue,
  UserAccount,
  Order,
  OrderItem,
  Customer,
  Brand
} from "../../types";
import { cn, getTodayIso, formatIsoToPretty } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import CustomerManagementModal from "./CustomerManagementModal";
import { VIETNAM_LOCATIONS } from "../../constants/locations";
import { Pagination } from "../Pagination";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface OrderManagementModalProps {
  orders: Order[];
  importOrders: ImportOrder[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  ledgerTransactions: LedgerTransaction[];
  ledgerPurposes: LedgerPurpose[];
  ledgerAccounts: LedgerAccount[];
  ledgerLogs: LedgerLog[];
  users: UserAccount[];
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateImportOrders: (orders: ImportOrder[]) => void;
  onUpdateTransactions: (transactions: LedgerTransaction[]) => void;
  onUpdateLogs: (logs: LedgerLog[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  customerGroups: CustomerGroup[];
  onUpdateGroups: (groups: CustomerGroup[]) => void;
  onViewDebtHistory?: (id: string) => void;
  onAddCardLog?: (customerName: string, action: string) => void;
  compressionSettings: ImageCompressionSettings;
  skinAudits: SkinAuditEntry[];
  skinAuditLogs: SkinAuditLog[];
  skinIssues: SkinIssue[];
  brands: Brand[];
  onUpdateSkinAudits: (audits: SkinAuditEntry[]) => void;
  onUpdateSkinAuditLogs: (logs: SkinAuditLog[]) => void;
  username: string;
  onClose: () => void;
  deviceView?: 'desktop' | 'mobile';
  isPage?: boolean;
}

export default function OrderManagementModal({
  orders,
  importOrders,
  suppliers,
  customers,
  products,
  ledgerTransactions,
  ledgerPurposes,
  ledgerAccounts,
  ledgerLogs,
  users,
  onUpdateOrders,
  onUpdateImportOrders,
  onUpdateTransactions,
  onUpdateLogs,
  onUpdateCustomers,
  customerGroups,
  onUpdateGroups,
  onViewDebtHistory,
  onAddCardLog,
  compressionSettings,
  skinAudits,
  skinAuditLogs,
  skinIssues,
  brands,
  onUpdateSkinAudits,
  onUpdateSkinAuditLogs,
  username,
  onClose,
  deviceView = 'desktop',
  isPage = false
}: OrderManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'import'>('sales');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);
  const [pinInput, setPinInput] = useState<{message: string, action: () => void} | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  
  const handleAddItem = () => {
    setFormState(prev => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount' as const, discountValue: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formState.items.length <= 1) return;
    setFormState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const userPassword = useMemo(() => users?.find(u => u.username === username)?.password, [users, username]);

  const handlePinConfirm = async () => {
    const actualPassword = userPassword || "1234";
    let isValid = pinValue === actualPassword;
    if (!isValid) {
      try {
        const loginEmail = auth.currentUser?.email || (username.includes('@') ? username : `${username}@app.local`);
        await signInWithEmailAndPassword(auth, loginEmail, pinValue);
        isValid = true;
      } catch (err) { isValid = false; }
    }
    if (isValid) {
      const action = pinInput?.action;
      setPinInput(null);
      setPinValue("");
      setPinError(false);
      action?.();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
    }
  };

  const requirePin = (message: string, action: () => void) => {
    setPinInput({ message, action });
  };

  const getCustomerBalance = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    const initial = customer?.initialDebt || 0;
    const customerTx = ledgerTransactions?.filter(t => t.customerId === customerId) || [];
    const thu = customerTx.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
    const chi = customerTx.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0);
    return initial + (chi - thu);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage, pageSize]);

  const totalPages = Math.ceil((activeTab === 'sales' ? orders.length : importOrders.length) / pageSize);

  // Autocomplete state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  const [productSearchIndex, setProductSearchIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // Form state
  const [formState, setFormState] = useState<{
    customerId: string;
    supplierId: string;
    items: (OrderItem & { discountType: 'amount' | 'percent', discountValue: number, subtotal: number })[];
    city: string;
    district: string;
    address: string;
  }>({
    customerId: "",
    supplierId: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }],
    city: "",
    district: "",
    address: ""
  });

  const customerSuggestions = useMemo(() => {
    if (customerSearch.length < 3) return [];
    return customers?.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())) || [];
  }, [customers, customerSearch]);

  const productSuggestions = useMemo(() => {
    if (productSearch.length < 3) return [];
    return products?.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())) || [];
  }, [products, productSearch]);

  const selectedCustomer = useMemo(() => 
    customers?.find(c => c.id === formState.customerId), 
    [customers, formState.customerId]
  );

  const selectedSupplier = useMemo(() => 
    suppliers?.find(s => s.id === formState.supplierId), 
    [suppliers, formState.supplierId]
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

  const handleItemChange = (index: number, updates: Partial<typeof formState.items[0]>) => {
    setFormState(prev => {
      const newItems = [...prev.items];
      const product = products?.find(p => p.id === updates.productId || (updates.productId === undefined && newItems[index].productId === p.id));
      
      const item = { ...newItems[index], ...updates };
      
      if (updates.productId !== undefined && product) {
        item.unitPrice = activeTab === 'sales' ? (product.price || product.details?.sellingPrice || 0) : (product.details?.importPrice || 0);
      }

      // Calculate discount value
      let discountVal = item.discountValue;
      if (item.discountType === 'percent') {
        discountVal = Math.round((item.unitPrice * item.quantity * item.discountValue) / 100);
      }
      item.discount = discountVal;

      item.subtotal = (item.unitPrice * item.quantity) - item.discount;
      newItems[index] = item;

      // Auto-add new row
      if (index === newItems.length - 1 && item.productId) {
        newItems.push({ productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 });
      }

      return { ...prev, items: newItems };
    });
  };

  const totals = useMemo(() => {
    const validItems = formState.items.filter(i => i.productId);
    const qty = validItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalBeforeDiscount = validItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
    const totalDiscount = validItems.reduce((sum, i) => sum + i.discount, 0);
    const totalAfterDiscount = totalBeforeDiscount - totalDiscount;
    return { qty, totalBeforeDiscount, totalDiscount, totalAfterDiscount };
  }, [formState.items]);

  const handleSave = () => {
    const validItems = formState.items.filter(item => item.productId && item.quantity > 0);
    if (activeTab === 'sales' && (!formState.customerId || validItems.length === 0)) return;
    if (activeTab === 'import' && (!formState.supplierId || validItems.length === 0)) return;

    setConfirmConfig({
      message: editingId ? `Xác nhận cập nhật ${activeTab === 'sales' ? 'đơn hàng' : 'phiếu nhập'}?` : `Xác nhận tạo ${activeTab === 'sales' ? 'đơn hàng' : 'phiếu nhập'} mới?`,
      action: async () => {
        setConfirmConfig(null);
        const orderId = editingId || (activeTab === 'sales' ? `ord-${Date.now()}` : `imp-${Date.now()}`);
        const purposeName = activeTab === 'sales' ? 'Khách' : 'Nhập hàng';
        const purpose = ledgerPurposes?.find(p => p.name === purposeName);
        
        // When creating order, set transaction without account linkage ("no account")
        const accountId = ""; 

        const date = getTodayIso();
        const total = totals.totalAfterDiscount;

        const transaction: LedgerTransaction | null = total > 0 && purpose ? {
          id: `tx-${activeTab === 'sales' ? 'ord' : 'imp'}-${orderId}`,
          accountId,
          purposeId: purpose.id,
          amount: total,
          date,
          reason: `${activeTab === 'sales' ? 'Đơn hàng' : 'Nhập hàng'} #${orderId.slice(-6).toUpperCase()}`,
          type: activeTab === 'sales' ? 'Thu' : 'Chi',
          createdAt: Date.now(),
          customerId: activeTab === 'sales' ? formState.customerId : undefined
        } : null;

        if (activeTab === 'sales') {
          const newOrder: Order = {
            id: orderId,
            customerId: formState.customerId,
            items: validItems.map(({ discountType, discountValue, ...rest }) => rest),
            totalAmount: total,
            date,
            createdAt: Date.now(),
            city: formState.city,
            district: formState.district,
            address: formState.address,
            transactionId: transaction?.id
          };

          if (editingId) {
            onUpdateOrders(orders.map(o => o.id === editingId ? newOrder : o));
            if (transaction) {
              onUpdateTransactions([transaction, ...ledgerTransactions.filter(t => t.id !== transaction.id)]);
            } else {
              onUpdateTransactions(ledgerTransactions.filter(t => t.id !== `tx-ord-${editingId}`));
            }
          } else {
            onUpdateOrders([newOrder, ...orders]);
            if (transaction) onUpdateTransactions([transaction, ...ledgerTransactions]);
          }
        } else {
          const newImport: ImportOrder = {
            id: orderId,
            supplierId: formState.supplierId,
            items: validItems.map(i => ({ productId: i.productId, quantity: i.quantity, importPrice: i.unitPrice, subtotal: i.subtotal })),
            totalAmount: total,
            date,
            createdAt: Date.now(),
            transactionId: transaction?.id
          };
          if (editingId) {
            onUpdateImportOrders(importOrders.map(o => o.id === editingId ? newImport : o));
            if (transaction) onUpdateTransactions([transaction, ...ledgerTransactions.filter(t => t.id !== transaction.id)]);
          } else {
            onUpdateImportOrders([newImport, ...importOrders]);
            if (transaction) onUpdateTransactions([transaction, ...ledgerTransactions]);
          }
        }

        setShowForm(false);
        setEditingId(null);
        setCustomerSearch("");
        setFormState({
          customerId: "",
          supplierId: "",
          items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }],
          city: "",
          district: "",
          address: ""
        });
      }
    });
  };

  const handleEdit = (order: Order) => {
    const cust = customers?.find(c => c.id === order.customerId);
    setFormState({
      customerId: order.customerId,
      supplierId: "",
      items: [...order.items.map(i => ({ ...i, discountType: 'amount' as const, discountValue: i.discount })), { productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount' as const, discountValue: 0 }],
      city: order.city || "",
      district: order.district || "",
      address: order.address || ""
    });
    setCustomerSearch(cust?.name || "");
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = (orderId: string, isImport: boolean = false) => {
    requirePin(`Bạn có chắc chắn muốn xóa ${isImport ? 'phiếu nhập' : 'đơn hàng'} này?`, () => {
      if (isImport) {
        onUpdateImportOrders(importOrders.filter(o => o.id !== orderId));
        onUpdateTransactions(ledgerTransactions.filter(t => t.id !== `tx-imp-${orderId}`));
      } else {
        const order = orders.find(o => o.id === orderId);
        const customer = customers.find(c => c.id === order?.customerId);
        onUpdateOrders(orders.filter(o => o.id !== orderId));
        onUpdateTransactions(ledgerTransactions.filter(t => t.id !== `tx-ord-${orderId}`));
        if (customer) onAddCardLog?.(customer.name, `Xóa đơn hàng ${orderId}`);
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('sales')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                  activeTab === 'sales' ? "bg-white text-sky-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >Bán hàng</button>
              <button 
                onClick={() => setActiveTab('import')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                  activeTab === 'import' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >Nhập hàng</button>
            </div>
          </div>
      </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
          {/* Create Area Toggle */}
          {!showForm && (
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowForm(true); setEditingId(null); }}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border",
                  activeTab === 'sales' ? "bg-sky-600 text-white shadow-sky-100 border-sky-700/10" : "bg-amber-600 text-white shadow-amber-100 border-amber-700/10"
                )}
              >
                <Plus className="w-5 h-5 stroke-[3]" /> TẠO {activeTab === 'sales' ? 'ĐƠN HÀNG' : 'PHIẾU NHẬP'} MỚI
              </button>
            </div>
          )}

          {/* List Area */}
          <div className="flex-1 bg-white border border-pastel-border rounded-[40px] overflow-hidden flex flex-col shadow-sm">
            <div className="hidden lg:flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0 items-center">
              <div className="w-10 text-center">STT</div>
              <div className="w-24 text-center">Ngày</div>
              <div className="w-48 px-4">{activeTab === 'sales' ? 'Khách hàng' : 'Nhà cung cấp'}</div>
              <div className="flex-1">Danh sách</div>
              <div className="w-28 text-right text-sky-600">Tổng tiền</div>
              <div className="w-28 text-right text-rose-500">Công nợ</div>
              <div className="w-24 text-right pr-4">Thao tác</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {activeTab === 'sales' ? paginatedOrders.map((order, idx) => {
                const customer = customers?.find(c => c.id === order.customerId);
                const debt = getCustomerBalance(order.customerId);
                
                return (
                  <div key={idx} className="flex flex-col lg:flex-row lg:items-start gap-4 p-4 hover:bg-sky-50/20 border-b border-pastel-border/30 last:border-0 transition-colors">
                    <div className="flex items-start lg:items-center justify-between lg:w-auto">
                      <span className="text-xs font-black text-pastel-subtext w-10 text-center lg:block hidden mt-2">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </span>
                      <div className="w-24 text-center lg:block hidden mt-2">
                         <span className="text-[10px] font-bold text-pastel-subtext">{formatIsoToPretty(order.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 px-0 lg:px-2 w-48">
                        <div className="w-10 h-10 rounded-xl bg-pastel-bg flex items-center justify-center overflow-hidden border border-pastel-border shrink-0">
                          {customer?.imageUrl ? <img src={customer.imageUrl} className="w-full h-full object-cover" /> : <UserPlus className="w-5 h-5 text-pastel-subtext/20" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-black text-[13px] text-slate-700 truncate">{customer?.name || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col space-y-1 lg:ml-0 ml-14">
                      {order.items.map((item, i) => {
                        const p = products?.find(prod => prod.id === item.productId);
                        return (
                          <div key={i} className="text-[11px] font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis flex flex-wrap gap-1 items-center border-b border-sky-50 last:border-0 py-1">
                            <span className="text-sky-500 font-black">{item.quantity} x {p?.name || 'Sản phẩm ' + item.productId}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-28 text-right shrink-0 hidden lg:block mt-1">
                      <span className="block font-black text-sm text-sky-600">{order.totalAmount.toLocaleString()}đ</span>
                    </div>

                    <div className="w-28 text-right shrink-0 hidden lg:block mt-1">
                      <span className={cn(
                        "block font-black text-xs",
                        debt > 0 ? "text-rose-500" : "text-emerald-500"
                      )}>{debt.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end w-full lg:w-24 mt-2 lg:mt-0">
                      <span className="lg:hidden text-[9px] font-bold text-pastel-subtext mr-auto">{formatIsoToPretty(order.date)}</span>
                      <button 
                        onClick={() => handleEdit(order)}
                        className="p-2.5 text-sky-500 bg-white border border-sky-100 rounded-xl shadow-sm hover:bg-sky-50 active:scale-90 transition-all font-bold text-[10px]"
                      >Sửa</button>
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2.5 text-rose-500 bg-white border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 active:scale-90 transition-all font-bold text-[10px]"
                      >Xóa</button>
                    </div>
                  </div>
                );
              }) : (
                importOrders.map((order, idx) => {
                  const sup = suppliers?.find(s => s.id === order.supplierId);
                  return (
                    <div key={idx} className="flex flex-col lg:flex-row lg:items-start gap-4 p-4 hover:bg-amber-50/20 border-b border-pastel-border/30 last:border-0 transition-colors">
                       <span className="text-xs font-black text-pastel-subtext w-10 text-center lg:block hidden mt-2">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </span>
                      <div className="w-24 text-center lg:block hidden mt-2">
                         <span className="text-[10px] font-bold text-pastel-subtext">{formatIsoToPretty(order.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 px-0 lg:px-2 w-48 font-black text-slate-700">
                         {sup?.name || "N/A"}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col space-y-1 lg:ml-0 ml-14">
                        {order.items.map((item, i) => {
                          const p = products?.find(prod => prod.id === item.productId);
                          return (
                            <div key={i} className="text-[11px] font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis flex flex-wrap gap-1 items-center border-b border-amber-50 last:border-0 py-1">
                              <span className="text-amber-500 font-black">{item.quantity} x {p?.name || 'Sản phẩm ' + item.productId}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="w-28 text-right mt-1 shrink-0">
                         <span className="block font-black text-sm text-amber-600">{order.totalAmount.toLocaleString()}đ</span>
                      </div>
                      <div className="w-28"></div>
                      <div className="flex items-center gap-1.5 shrink-0 justify-end w-full lg:w-24 mt-2 lg:mt-0">
                        <button 
                          onClick={() => {
                             setActiveTab('import');
                             setFormState({
                                supplierId: order.supplierId,
                                customerId: "",
                                items: [...order.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.importPrice, discount: 0, subtotal: i.subtotal, discountType: 'amount' as const, discountValue: 0 })), { productId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0, discountType: 'amount', discountValue: 0 }],
                                city: "", district: "", address: ""
                             });
                             setEditingId(order.id);
                             setShowForm(true);
                          }}
                          className="p-2.5 text-amber-500 bg-white border border-amber-100 rounded-xl shadow-sm hover:bg-amber-50 active:scale-90 transition-all font-bold text-[10px]"
                        >Sửa</button>
                        <button 
                          onClick={() => handleDelete(order.id, true)}
                          className="p-2.5 text-rose-500 bg-white border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 active:scale-90 transition-all font-bold text-[10px]"
                        >Xóa</button>
                      </div>
                    </div>
                  );
                })
              )}
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
                                placeholder="Nhập tên khách hàng..."
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
                        <div className="flex justify-end mt-2">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setFormState(prev => ({ ...prev, city: "", district: "", address: "" }));
                            }}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 border border-rose-100 bg-rose-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all w-max"
                          >
                            Địa chỉ khác
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Empty or other info if needed, or just let items take full width */}
                    <div className="hidden lg:block" />
                  </div>

                  {/* Items List - Full Width Below Info */}
                  <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[11px] font-black text-pastel-subtext uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                        <Package className="w-4 h-4" /> Danh sách sản phẩm
                      </h4>
                      <button 
                        onClick={handleAddItem}
                        className="lg:hidden p-2 bg-sky-50 text-sky-600 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formState.items.map((item, index) => (
                        <div key={index} className="flex flex-col gap-3 bg-white p-3 md:p-4 rounded-2xl border border-pastel-border/50 relative group">
                          <div className="flex gap-3">
                            <div className="flex-1 min-w-0">
                              <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Sản phẩm</label>
                              <div className="relative">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Tìm sản phẩm..."
                                    value={productSearchIndex === index ? productSearch : (products.find(p => p.id === item.productId)?.name || "")}
                                    onChange={(e) => {
                                      setProductSearch(e.target.value);
                                      setProductSearchIndex(index);
                                      if (!e.target.value) handleItemChange(index, { productId: "" });
                                    }}
                                    onFocus={() => {
                                      setProductSearchIndex(index);
                                      setProductSearch("");
                                    }}
                                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-2.5 md:p-3 text-xs font-bold outline-none focus:border-sky-300"
                                  />
                                </div>
                                
                                <AnimatePresence>
                                  {productSearchIndex === index && productSuggestions.length > 0 && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-pastel-border rounded-xl shadow-xl z-[60] overflow-hidden max-h-48 overflow-y-auto no-scrollbar"
                                    >
                                      {productSuggestions.map(p => (
                                        <button
                                          key={p.id}
                                          onClick={() => {
                                            handleItemChange(index, { productId: p.id });
                                            setProductSearch("");
                                            setProductSearchIndex(null);
                                          }}
                                          className="w-full px-4 py-3 text-left hover:bg-sky-50 flex flex-col transition-colors border-b border-pastel-border/30 last:border-0"
                                        >
                                          <span className="text-xs font-bold text-slate-700">{p.name}</span>
                                          <span className="text-[10px] text-pastel-subtext">
                                            {brands.find(b => b.id === p.brandId)?.name} - {((activeTab === 'sales' ? (p.price || p.details?.sellingPrice || 0) : (p.details?.importPrice || 0))).toLocaleString()}đ
                                          </span>
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              
                              {/* MFG / EXP Dates */}
                              {(item.mfgDate || item.expDate) && (
                                <div className="flex gap-4 mt-2 px-1">
                                  {item.mfgDate && (
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="font-black text-slate-400 uppercase">MFG:</span>
                                      <span className="font-bold text-slate-700">{item.mfgDate.split('-').reverse().join('/')}</span>
                                    </div>
                                  )}
                                  {item.expDate && (
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="font-black text-rose-400 uppercase">EXP:</span>
                                      <span className="font-bold text-rose-600">{item.expDate.split('-').reverse().join('/')}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="w-16 md:w-20 shrink-0">
                              <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block text-center">SL</label>
                              <input 
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-2.5 md:p-3 text-xs font-bold text-center outline-none focus:border-sky-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                            <div>
                              <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Giá bán</label>
                              <div className="relative">
                                <input 
                                  type="text"
                                  value={item.unitPrice.toLocaleString('vi-VN')}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                    handleItemChange(index, { unitPrice: val });
                                  }}
                                  className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-2.5 md:p-3 text-[11px] md:text-xs font-black outline-none focus:border-sky-300"
                                />
                                <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-pastel-subtext pointer-events-none" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Ưu đãi</label>
                              <div className="flex bg-pastel-bg border border-pastel-border rounded-xl p-1 h-[41px] md:h-[46px]">
                                <input 
                                  type="number"
                                  value={item.discountValue}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleItemChange(index, { discountValue: val });
                                  }}
                                  className="w-full bg-transparent px-2 text-[11px] md:text-xs font-bold text-rose-500 outline-none min-w-0"
                                  placeholder="0"
                                />
                                <div className="flex gap-0.5 md:gap-1 shrink-0">
                                  <button 
                                    onClick={() => handleItemChange(index, { discountType: 'amount' })}
                                    className={cn(
                                      "p-1 rounded-lg transition-all",
                                      item.discountType === 'amount' ? "bg-rose-500 text-white shadow-sm" : "text-pastel-subtext hover:bg-white"
                                    )}
                                  >
                                    <Banknote className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleItemChange(index, { discountType: 'percent' })}
                                    className={cn(
                                      "p-1 rounded-lg transition-all",
                                      item.discountType === 'percent' ? "bg-rose-500 text-white shadow-sm" : "text-pastel-subtext hover:bg-white"
                                    )}
                                  >
                                    <Percent className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2 lg:col-span-1">
                              <label className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest mb-1.5 ml-1 block">Thành tiền</label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-sky-50 border border-sky-100 rounded-xl p-2.5 md:p-3 text-xs font-black text-sky-600">
                                  {item.subtotal.toLocaleString('vi-VN')} đ
                                </div>
                                {formState.items.length > 1 && (
                                  <button 
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-2.5 text-rose-400 hover:text-rose-600 transition-all bg-rose-50 rounded-xl"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-12 border-t border-pastel-border pt-6 bg-white sticky bottom-0 z-40 pb-6 -mx-6 px-6">
                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6">
                        {/* Flat Summary Style */}
                        <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-pastel-bg rounded-2xl border border-pastel-border shadow-inner">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest leading-none mb-1">Số lượng</span>
                            <span className="text-sm font-black text-slate-700">{totals.qty} SP</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-pastel-subtext uppercase tracking-widest leading-none mb-1">Tổng tiền</span>
                            <span className="text-sm font-black text-slate-700">{totals.totalBeforeDiscount.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Ưu đãi</span>
                            <span className="text-sm font-black text-rose-500">-{totals.totalDiscount.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest leading-none mb-1">Cần thanh toán</span>
                            <span className="text-base font-black text-sky-600">{totals.totalAfterDiscount.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:w-80 w-full shrink-0">
                          <button 
                            onClick={handleSave}
                            disabled={!formState.customerId || formState.items.filter(i => i.productId).length === 0}
                            className={cn(
                              "flex-1 md:h-16 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 border-b-4",
                              !formState.customerId || formState.items.filter(i => i.productId).length === 0
                                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                                : "bg-sky-600 text-white hover:bg-sky-700 shadow-sky-100 border-sky-800"
                            )}
                          >
                            <Save className="w-5 h-5" /> {editingId ? "CẬP NHẬT" : "TẠO ĐƠN"}
                          </button>
                        </div>
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
            ledgerAccounts={ledgerAccounts}
            ledgerPurposes={ledgerPurposes}
            onUpdateTransactions={onUpdateTransactions}
            onUpdateLogs={onUpdateLogs}
            skinAudits={skinAudits}
            skinAuditLogs={skinAuditLogs}
            skinIssues={skinIssues}
            username={username}
            onUpdateSkinAudits={onUpdateSkinAudits}
            onUpdateSkinAuditLogs={onUpdateSkinAuditLogs}
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

        {pinInput && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[2200] p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1, x: pinError ? [0, -10, 10, -5, 5, 0] : 0 }} 
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center relative"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Xác minh bảo mật</h3>
              <p className="text-sm font-medium text-pastel-subtext mb-6">{pinInput.message}</p>
              <div className="space-y-3 mb-6">
                <input 
                  type="password"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePinConfirm()}
                  className={cn(
                    "w-full bg-pastel-bg border-4 rounded-2xl p-4 text-center text-sm font-black outline-none transition-all",
                    pinError ? "border-red-500" : "border-pastel-border focus:border-rose-400"
                  )}
                  placeholder="Nhập mật khẩu"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setPinInput(null); setPinValue(""); setPinError(false); }} 
                  className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl active:scale-95"
                >
                  Hủy
                </button>
                <button 
                  onClick={handlePinConfirm}
                  className="flex-1 py-4 font-black text-white bg-slate-800 rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
  );
}
