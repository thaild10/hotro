import React, { useState, useMemo } from "react";
import { X, Plus, Image as ImageIcon, Trash2, Pencil, ChevronLeft, ChevronRight, User, Save, Users, History, Stethoscope, Search, CheckCircle2, Wallet, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer, ImageCompressionSettings, CustomerGroup, LedgerTransaction, SkinAuditEntry, SkinAuditLog, LedgerAccount, LedgerPurpose, LedgerLog, SkinIssue } from "../../types";
import { cn, getTodayIso } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "../Pagination";
import { uploadToFirebase } from "../../lib/imageUtils";

import { DEFAULT_CUSTOMERS_TEXT } from "../../constants/defaultCustomers";
import ImageCropperModal from "./ImageCropperModal";

interface CustomerManagementModalProps {
  customers: Customer[];
  customerGroups: CustomerGroup[];
  transactions: LedgerTransaction[];
  ledgerAccounts: LedgerAccount[];
  ledgerPurposes: LedgerPurpose[];
  onUpdateTransactions: (transactions: LedgerTransaction[]) => void;
  onUpdateLogs: (logs: LedgerLog[]) => void;
  skinAudits: SkinAuditEntry[];
  skinAuditLogs: SkinAuditLog[];
  skinIssues: SkinIssue[];
  username: string;
  onClose: () => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateGroups: (groups: CustomerGroup[]) => void;
  onUpdateSkinAudits: (audits: SkinAuditEntry[]) => void;
  onUpdateSkinAuditLogs: (logs: SkinAuditLog[]) => void;
  onViewDebtHistory: (customerId: string) => void;
  compressionSettings: ImageCompressionSettings;
  deviceView?: 'desktop' | 'mobile';
}

const ITEMS_PER_PAGE = 10;

export default function CustomerManagementModal({ 
  customers, 
  customerGroups,
  transactions,
  ledgerAccounts,
  ledgerPurposes,
  onUpdateTransactions,
  onUpdateLogs,
  skinAudits,
  skinAuditLogs,
  skinIssues,
  username,
  onClose, 
  onUpdateCustomers,
  onUpdateGroups,
  onUpdateSkinAudits,
  onUpdateSkinAuditLogs,
  onViewDebtHistory,
  compressionSettings,
  deviceView = 'desktop'
}: CustomerManagementModalProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [initialDebtStr, setInitialDebtStr] = useState("0");
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ phone: "" });
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [cropperData, setCropperData] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState(DEFAULT_CUSTOMERS_TEXT);
  const [newGroupName, setNewGroupName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinIssueDropdownFor, setSkinIssueDropdownFor] = useState<string | null>(null);
  const [inlineEditingAudit, setInlineEditingAudit] = useState<{
    customerId: string,
    month: string,
    type: 'Khám' | 'Kiểm tra',
    id?: string
  } | null>(null);
  const [inlineDateValue, setInlineDateValue] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getCustomerBalance = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const initial = customer?.initialDebt || 0;
    const customerTx = transactions.filter(t => t.customerId === customerId);
    const thu = customerTx.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
    const chi = customerTx.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0);
    return initial + (chi - thu);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.address?.toLowerCase().includes(q) || 
      c.city?.toLowerCase().includes(q) || 
      c.district?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const last3Months = useMemo(() => {
    const now = new Date();
    const months = [];
    // Show [now-1, now, now+1]
    for (let i = -1; i <= 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      months.push({
        label: `T${m}`,
        value: `${y}-${m.toString().padStart(2, '0')}`
      });
    }
    return months;
  }, []);

  const handleToggleSkinAudit = (customerId: string, month: string, type: 'Khám' | 'Kiểm tra', manualDate?: string) => {
    const existing = skinAudits.find(e => e.customerId === customerId && e.month === month && e.type === type);
    
    if (existing) {
      // Delete
      onUpdateSkinAudits(skinAudits.filter(e => e.id !== existing.id));
      const newLog: SkinAuditLog = {
        id: `log-${Date.now()}`,
        customerId,
        action: 'delete',
        type,
        month,
        date: existing.date,
        user: username,
        timestamp: new Date().toLocaleString('vi-VN')
      };
      onUpdateSkinAuditLogs([newLog, ...skinAuditLogs]);
    } else {
      // Create
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const todayFormatted = `${dd}.${mm}.${yyyy}`;

      const newEntry: SkinAuditEntry = {
        id: `audit-${Date.now()}`,
        customerId,
        month,
        type,
        date: manualDate || todayFormatted,
        createdBy: username,
        createdAt: new Date().toLocaleString('vi-VN')
      };
      onUpdateSkinAudits([...skinAudits, newEntry]);
      const newLog: SkinAuditLog = {
        id: `log-${Date.now()}`,
        customerId,
        action: 'create',
        type,
        month,
        date: newEntry.date,
        user: username,
        timestamp: new Date().toLocaleString('vi-VN')
      };
      onUpdateSkinAuditLogs([newLog, ...skinAuditLogs]);
    }
  };

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
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const url = await uploadToFirebase(file, 'customers', compressionSettings);
      setImageUrl(url);
    } catch (error) {
      console.error("Upload fail:", error);
      alert(error instanceof Error ? error.message : "Upload ảnh thất bại, vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateOrUpdate = () => {
    if (!name.trim()) return;
    const targetBalance = parseFloat(initialDebtStr.replace(/\./g, "").replace(/,/g, "")) || 0;

    if (editingId) {
      const updated = customers.map(c => 
        c.id === editingId ? { 
          ...c, 
          name: name.trim(), 
          phone: (formState as any).phone?.trim() || c.phone,
          imageUrl, 
          groupId: selectedGroupId || undefined, 
          city: city.trim() || undefined, 
          district: district.trim() || undefined, 
          address: address.trim() || undefined,
          initialDebt: targetBalance - (transactions.filter(t => t.customerId === editingId).reduce((sum, t) => sum + (t.type === 'Chi' ? t.amount : -t.amount), 0))
        } : c
      );
      onUpdateCustomers(updated);
      setEditingId(null);
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: name.trim(),
        phone: (formState as any).phone?.trim(),
        imageUrl,
        groupId: selectedGroupId || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        address: address.trim() || undefined,
        initialDebt: targetBalance
      };
      onUpdateCustomers([newCustomer, ...customers]);
      setShowCustomerForm(false);
    }
    setName("");
    setImageUrl("");
    setSelectedGroupId("");
    setCity("");
    setDistrict("");
    setAddress("");
    setInitialDebtStr("0");
    setFormState({ phone: "" });
  };

  const handleEdit = (customer: Customer) => {
    setName(customer.name);
    setFormState({ phone: customer.phone || "" });
    setImageUrl(customer.imageUrl || "");
    setSelectedGroupId(customer.groupId || "");
    setCity(customer.city || "");
    setDistrict(customer.district || "");
    setAddress(customer.address || "");
    // Initialize with current balance instead of initial debt
    setInitialDebtStr(getCustomerBalance(customer.id).toString());
    setEditingId(customer.id);
    setShowCustomerForm(true);
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

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const name = newGroupName.trim();
    setConfirmConfig({
      message: `Bạn có chắc chắn muốn tạo nhóm "${name}"?`,
      action: () => {
        const newGroup: CustomerGroup = {
          id: `group-${Date.now()}`,
          name: name
        };
        onUpdateGroups([...customerGroups, newGroup]);
        setNewGroupName("");
        setShowGroupManagement(false);
        setConfirmConfig(null);
      }
    });
  };

  const handleBulkImportAction = () => {
    if (!bulkText.trim()) return;
    const text = bulkText.trim();
    
    setConfirmConfig({
      message: "Bạn có chắc muốn nhập danh sách khách hàng này? (Dữ liệu sẽ được thêm vào cuối danh sách hiện tại)",
      action: () => {
        const lines = text.split('\n').filter(l => l.trim());
        const newCustomers: Customer[] = [...customers];
        const newGroups: CustomerGroup[] = [...customerGroups];

        lines.forEach(line => {
          let gn = "Chưa phân nhóm";
          if (line.includes(" - QL - ")) gn = "QL";
          else if (line.includes(" - BL - ")) gn = "BL";
          else if (line.toLowerCase().includes("care 1")) gn = "Care 1";
          else if (line.toLowerCase().includes("care 2")) gn = "Care 2";

          let group = newGroups.find(g => g.name === gn);
          if (gn !== "Chưa phân nhóm" && !group) {
            group = { id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name: gn };
            newGroups.push(group);
          }

          newCustomers.push({
            id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: line.trim(),
            groupId: group?.id || undefined
          });
        });

        onUpdateGroups(newGroups);
        onUpdateCustomers(newCustomers);
        setBulkText("");
        setShowBulkImport(false);
        setConfirmConfig(null);
      }
    });
  };

  const [showAuditHistoryCustId, setShowAuditHistoryCustId] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  const getAuditLogsForCustomer = (customerId: string) => {
    return skinAuditLogs
      .filter(log => log.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Bạn có chắc chắn muốn xóa khách hàng này?",
      action: () => {
        onUpdateCustomers(customers.filter(c => c.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const handleCancelGroup = () => {
    if (newGroupName.trim()) {
      setConfirmConfig({
        message: "Bạn có chắc chắn muốn hủy? Dữ liệu đang nhập sẽ bị mất.",
        action: () => {
          setNewGroupName("");
          setShowGroupManagement(false);
          setConfirmConfig(null);
        }
      });
    } else {
      setShowGroupManagement(false);
    }
  };

  const handleCancelBulk = () => {
    if (bulkText.trim() && bulkText !== DEFAULT_CUSTOMERS_TEXT) {
      setConfirmConfig({
        message: "Bạn có chắc chắn muốn hủy? Dữ liệu đang nhập sẽ bị mất.",
        action: () => {
          setBulkText(DEFAULT_CUSTOMERS_TEXT);
          setShowBulkImport(false);
          setConfirmConfig(null);
        }
      });
    } else {
      setShowBulkImport(false);
    }
  };

  const handleCancelCustomerForm = () => {
    if (name.trim() || imageUrl || initialDebtStr !== "0") {
      setConfirmConfig({
        message: "Bạn có chắc chắn muốn hủy? Dữ liệu đang nhập sẽ bị mất.",
        action: () => {
          setName("");
          setImageUrl("");
          setSelectedGroupId("");
          setCity("");
          setDistrict("");
          setAddress("");
          setInitialDebtStr("0");
          setEditingId(null);
          setShowCustomerForm(false);
          setConfirmConfig(null);
        }
      });
    } else {
      setEditingId(null);
      setShowCustomerForm(false);
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
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Khách hàng</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
        {/* Create Area Toggle */}
        {!showCustomerForm && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pastel-subtext" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery("");
                    setCurrentPage(1);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="Tìm kiếm khách hàng theo tên, địa chỉ (gõ 3 ký tự)..."
                className="w-full bg-pastel-bg border border-pastel-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/5 transition-all"
              />
              {searchQuery.length >= 3 && (customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-rose-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 5)
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSearchQuery(c.name);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors flex items-center gap-3 border-b border-rose-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {c.imageUrl ? <img src={c.imageUrl} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-rose-400" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{c.name}</div>
                          <div className="text-[10px] text-pastel-subtext">{c.phone || "Không có SĐT"}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCustomerForm(true)}
                className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-600/10"
              >
                <Plus className="w-5 h-5 stroke-[3]" /> THÊM KHÁCH HÀNG MỚI
              </button>
              <button 
                onClick={() => setShowGroupManagement(true)}
                className="w-14 h-14 bg-white border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100/20 active:scale-95 transition-all"
                title="Quản lý nhóm"
              >
                <Users className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setShowBulkImport(true)}
                className="w-14 h-14 bg-white border border-rose-100 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100/20 active:scale-95 transition-all"
              >
                <Save className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Create Area Form */}
        {showCustomerForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-100 shadow-inner overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest">
                {editingId ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
              </h3>
              <button onClick={handleCancelCustomerForm} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-rose-100 flex items-center justify-center cursor-pointer overflow-hidden hover:border-rose-400 transition-all",
                    isUploading && "opacity-50 cursor-wait",
                    imageUrl && "border-solid border-rose-500 shadow-md"
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
                      <ImageIcon className="w-6 h-6 text-rose-200" />
                      <span className="text-[8px] font-black text-rose-200 uppercase">Ảnh</span>
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
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1 block">Tên khách hàng</label>
                    <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Họ và tên..."
                      className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm"
                    />
                    <input 
                      type="text" 
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      placeholder="Số điện thoại..."
                      className="w-32 bg-white border border-rose-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm"
                    />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <label className="text-[10px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1 block">Nhóm</label>
                    <select 
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full bg-white border border-rose-100 rounded-xl px-2 py-3.5 text-xs font-bold outline-none h-[50px]"
                    >
                      <option value="">Nhóm...</option>
                      {customerGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-48">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 mb-1 block">Số dư hiện tại</label>
                    <input 
                      type="text" 
                      value={initialDebtStr === "" ? "" : Number(initialDebtStr).toLocaleString('vi-VN')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setInitialDebtStr(val);
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-rose-100 rounded-xl px-4 py-3.5 text-sm font-black text-rose-500 outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm h-[50px]"
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Thành phố..."
                    className="w-full md:w-1/3 bg-white border border-rose-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm"
                  />
                  <input 
                    type="text" 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Quận/Huyện..."
                    className="w-full md:w-1/3 bg-white border border-rose-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm"
                  />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Địa chỉ chi tiết..."
                    className="w-full md:w-1/3 bg-white border border-rose-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleCreateOrUpdate}
                    className="flex-1 bg-rose-500 text-white py-3.5 rounded-xl font-black text-xs shadow-xl shadow-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-600/10"
                  >
                    <Save className="w-4 h-4" /> {editingId ? "Cập nhật" : "Lưu khách hàng"}
                  </button>
                  <button 
                    onClick={handleCancelCustomerForm}
                    className="px-6 bg-white border border-rose-100 text-rose-400 rounded-xl font-bold text-xs active:scale-95 transition-all"
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
          <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0 items-center">
            <div className="w-10 text-center">STT</div>
            <div className="flex-1">Khách hàng</div>
            <div className="w-24 text-center">Thông tin da</div>
            <div className="hidden md:flex w-48 justify-center gap-1">
              {last3Months.map(m => (
                <div key={m.value} className="w-14 text-center text-[8px]">{m.label}</div>
              ))}
            </div>
            <div className="w-24 md:w-32 text-right pr-4">Số dư</div>
            <div className="w-24 text-right">Thao tác</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 no-scrollbar">
            {paginatedCustomers.map((customer, index) => (
              <div key={customer.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-pastel-bg/30 border-b border-pastel-border/30 last:border-0 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-[10px] font-black text-pastel-subtext w-8 text-center shrink-0">
                    {(currentPage - 1) * pageSize + index + 1}
                  </span>
                  
                  <div 
                    onClick={() => customer.imageUrl && setSelectedImageUrl(customer.imageUrl)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-pastel-bg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform"
                  >
                    {customer.imageUrl ? (
                      <img src={customer.imageUrl} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 md:w-6 md:h-6 text-pastel-subtext/20" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 relative">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-700 truncate">{customer.name}</span>
                      {customer.phone && <span className="text-sm font-bold text-rose-500">{customer.phone}</span>}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {(customer.address || customer.district || customer.city) && (
                        <span className="block w-full text-[9px] text-slate-500 truncate leading-tight">
                          {[customer.address, customer.district, customer.city].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <span className="block text-[8px] font-bold text-rose-500 uppercase tracking-tighter">
                        {customerGroups.find(g => g.id === customer.groupId)?.name || "Chưa phân nhóm"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.skinIssues?.map(id => {
                        const si = skinIssues.find(s => s.id === id);
                        return si ? <span key={id} className="bg-amber-100 text-amber-700 font-bold text-[9px] px-1.5 py-0.5 rounded-md">{si.name}</span> : null;
                      })}
                      <button 
                        onClick={() => setSkinIssueDropdownFor(skinIssueDropdownFor === customer.id ? null : customer.id)}
                        className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-md transition-colors"
                      >
                        + Tình trạng da
                      </button>
                    </div>

                    {skinIssueDropdownFor === customer.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSkinIssueDropdownFor(null)} />
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-pastel-border rounded-xl shadow-xl z-50 p-2 py-2 max-h-48 overflow-y-auto">
                          {skinIssues.length === 0 ? (
                            <p className="text-xs text-slate-400 p-2 text-center">Chưa có vấn đề da nào.</p>
                          ) : (
                            skinIssues.map(issue => {
                              const isSelected = customer.skinIssues?.includes(issue.id);
                              return (
                                <button
                                  key={issue.id}
                                  onClick={() => {
                                    const curr = customer.skinIssues || [];
                                    const next = isSelected ? curr.filter(id => id !== issue.id) : [...curr, issue.id];
                                    onUpdateCustomers(customers.map(c => c.id === customer.id ? { ...c, skinIssues: next } : c));
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                  <span className={isSelected ? "text-amber-600" : "text-slate-600"}>{issue.name}</span>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-500" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-1.5 border-t md:border-t-0 border-pastel-border/30 pt-3 md:pt-0">
                  {/* Skin Check - last 3 months */}
                  <div className="flex gap-1 shrink-0 overflow-x-auto no-scrollbar py-1">
                    {last3Months.map((month) => {
                      const exam = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Khám');
                      const check = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Kiểm tra');
                      
                      return (
                        <div key={month.value} className="flex flex-col gap-1 items-center w-14 shrink-0">
                          {/* Khám Logic */}
                          {inlineEditingAudit?.customerId === customer.id && 
                           inlineEditingAudit.month === month.value && 
                           inlineEditingAudit.type === 'Khám' ? (
                            <div className="w-full flex flex-col gap-1">
                              <input 
                                type="text"
                                value={inlineDateValue}
                                onChange={e => setInlineDateValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && inlineDateValue) {
                                    let finalDate = inlineDateValue;
                                    
                                    // If user typed just a number (e.g., "14")
                                    if (/^\d{1,2}$/.test(inlineDateValue)) {
                                      const monthParts = month.value.split('-');
                                      finalDate = `${inlineDateValue.padStart(2, '0')}.${monthParts[1]}.2026`;
                                    } else if (inlineDateValue.match(/^T(\d+)$/i)) {
                                      const monthNum = inlineDateValue.match(/^T(\d+)$/i)![1].padStart(2, '0');
                                      finalDate = `14.${monthNum}.2026`;
                                    }

                                    if (inlineEditingAudit.id) {
                                      const updated = skinAudits.map(a => a.id === inlineEditingAudit.id ? { ...a, date: finalDate } : a);
                                      onUpdateSkinAudits(updated);
                                    } else {
                                      handleToggleSkinAudit(customer.id, month.value, 'Khám', finalDate);
                                    }
                                    setInlineEditingAudit(null);
                                  }
                                  if (e.key === 'Escape') setInlineEditingAudit(null);
                                }}
                                autoFocus
                                className="w-full py-1 text-[8px] font-bold text-center border-2 border-rose-400 rounded-lg outline-none"
                                placeholder="14"
                              />
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => setInlineEditingAudit(null)} className="p-0.5 text-rose-500"><X className="w-2.5 h-2.5" /></button>
                                <button 
                                  onClick={() => {
                                  if (!inlineDateValue) return;
                                  let finalDate = inlineDateValue;
                                  if (/^\d{1,2}$/.test(inlineDateValue)) {
                                    const monthParts = month.value.split('-');
                                    finalDate = `${inlineDateValue.padStart(2, '0')}.${monthParts[1]}.2026`;
                                  } else if (inlineDateValue.match(/^T(\d+)$/i)) {
                                    const monthNum = inlineDateValue.match(/^T(\d+)$/i)![1].padStart(2, '0');
                                    finalDate = `14.${monthNum}.2026`;
                                  }

                                  if (inlineEditingAudit.id) {
                                    const updated = skinAudits.map(a => a.id === inlineEditingAudit.id ? { ...a, date: finalDate } : a);
                                    onUpdateSkinAudits(updated);
                                  } else {
                                    handleToggleSkinAudit(customer.id, month.value, 'Khám', finalDate);
                                  }
                                  setInlineEditingAudit(null);
                                }}
                                  className="p-0.5 text-emerald-500"
                                >
                                  <Save className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            !exam ? (
                              <button 
                                onClick={() => {
                                  setInlineEditingAudit({ customerId: customer.id, month: month.value, type: 'Khám' });
                                  setInlineDateValue("14");
                                }}
                                className="w-full py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-extrabold text-[8px] flex items-center justify-center active:scale-90 transition-all hover:bg-rose-100"
                              >
                                KHÁM
                              </button>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 w-full">
                                <span className="text-[9px] font-black text-rose-600 underline leading-none">{exam.date.split('.')[0]}</span>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => {
                                      setInlineEditingAudit({ customerId: customer.id, month: month.value, type: 'Khám', id: exam.id });
                                      setInlineDateValue(exam.date);
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors"
                                  >
                                    <Pencil className="w-2 h-2" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setConfirmConfig({
                                        message: "Xóa ngày khám?",
                                        action: () => {
                                          handleToggleSkinAudit(customer.id, month.value, 'Khám');
                                          setConfirmConfig(null);
                                        }
                                      });
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 className="w-2 h-2" />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
  
                          {/* Kiểm tra Logic */}
                          {inlineEditingAudit?.customerId === customer.id && 
                           inlineEditingAudit.month === month.value && 
                           inlineEditingAudit.type === 'Kiểm tra' ? (
                            <div className="w-full flex flex-col gap-1 mt-1">
                              <input 
                                type="text"
                                value={inlineDateValue}
                                onChange={e => setInlineDateValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && inlineDateValue) {
                                    let finalDate = inlineDateValue;

                                    if (/^\d{1,2}$/.test(inlineDateValue)) {
                                      const monthParts = month.value.split('-');
                                      finalDate = `${inlineDateValue.padStart(2, '0')}.${monthParts[1]}.2026`;
                                    } else if (inlineDateValue.match(/^T(\d+)$/i)) {
                                      const monthNum = inlineDateValue.match(/^T(\d+)$/i)![1].padStart(2, '0');
                                      finalDate = `14.${monthNum}.2026`;
                                    }

                                    if (inlineEditingAudit.id) {
                                      const updated = skinAudits.map(a => a.id === inlineEditingAudit.id ? { ...a, date: finalDate } : a);
                                      onUpdateSkinAudits(updated);
                                    } else {
                                      handleToggleSkinAudit(customer.id, month.value, 'Kiểm tra', finalDate);
                                    }
                                    setInlineEditingAudit(null);
                                  }
                                  if (e.key === 'Escape') setInlineEditingAudit(null);
                                }}
                                autoFocus
                                className="w-full py-1 text-[8px] font-bold text-center border-2 border-emerald-400 rounded-lg outline-none"
                                placeholder="14"
                              />
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => setInlineEditingAudit(null)} className="p-0.5 text-rose-500"><X className="w-2.5 h-2.5" /></button>
                                <button 
                                  onClick={() => {
                                    if (!inlineDateValue) return;
                                    let finalDate = inlineDateValue;
                                    if (/^\d{1,2}$/.test(inlineDateValue)) {
                                      const monthParts = month.value.split('-');
                                      finalDate = `${inlineDateValue.padStart(2, '0')}.${monthParts[1]}.2026`;
                                    } else if (inlineDateValue.match(/^T(\d+)$/i)) {
                                      const monthNum = inlineDateValue.match(/^T(\d+)$/i)![1].padStart(2, '0');
                                      finalDate = `14.${monthNum}.2026`;
                                    }

                                    if (inlineEditingAudit.id) {
                                      const updated = skinAudits.map(a => a.id === inlineEditingAudit.id ? { ...a, date: finalDate } : a);
                                      onUpdateSkinAudits(updated);
                                    } else {
                                      handleToggleSkinAudit(customer.id, month.value, 'Kiểm tra', finalDate);
                                    }
                                    setInlineEditingAudit(null);
                                  }}
                                  className="p-0.5 text-emerald-500"
                                >
                                  <Save className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            !check ? (
                              !exam && (
                                <button 
                                  onClick={() => {
                                    setInlineEditingAudit({ customerId: customer.id, month: month.value, type: 'Kiểm tra' });
                                    setInlineDateValue("14");
                                  }}
                                  className="w-full py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 font-extrabold text-[8px] flex items-center justify-center active:scale-90 transition-all hover:bg-emerald-100"
                                >
                                  K.TRA
                                </button>
                              )
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 w-full mt-1">
                                <span className="text-[9px] font-black text-emerald-600 underline leading-none">{check.date.split('.')[0]}</span>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => {
                                      setInlineEditingAudit({ customerId: customer.id, month: month.value, type: 'Kiểm tra', id: check.id });
                                      setInlineDateValue(check.date);
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors"
                                  >
                                    <Pencil className="w-2 h-2" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setConfirmConfig({
                                        message: "Xóa ngày kiểm tra?",
                                        action: () => {
                                          handleToggleSkinAudit(customer.id, month.value, 'Kiểm tra');
                                          setConfirmConfig(null);
                                        }
                                      });
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 className="w-2 h-2" />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-24 md:w-32 text-right shrink-0">
                    <span className={cn(
                      "font-black text-sm block leading-none",
                      getCustomerBalance(customer.id) > 0 ? "text-rose-500" : (getCustomerBalance(customer.id) < 0 ? "text-emerald-500" : "text-slate-400")
                    )}>
                      {getCustomerBalance(customer.id).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[8px] font-bold text-pastel-subtext uppercase block mt-1 tracking-tighter">Số dư</span>
                  </div>

                  <div className={cn(
                    "flex items-center gap-1 shrink-0 justify-end w-24 md:w-32",
                    editingId === customer.id && "opacity-20 pointer-events-none"
                  )}>
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-violet-500 bg-white border border-violet-100 rounded-lg shadow-sm hover:bg-violet-50 active:scale-90 transition-all cursor-pointer"
                      title="Sửa thông tin"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setShowAuditHistoryCustId(customer.id)}
                      className="p-2 text-amber-500 bg-white border border-amber-100 rounded-lg shadow-sm hover:bg-amber-50 active:scale-90 transition-all cursor-pointer"
                      title="Lịch sử khám & số dư"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-rose-500 bg-white border border-rose-100 rounded-lg shadow-sm hover:bg-rose-50 active:scale-90 transition-all cursor-pointer"
                      title="Xóa khách hàng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="h-60 flex flex-col items-center justify-center text-pastel-subtext italic text-sm gap-2">
                <User className="w-10 h-10 opacity-20" />
                <span>Chưa có khách hàng nào</span>
              </div>
            )}
            
            {customers.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                totalItems={customers.length}
              />
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
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8"
            onClick={() => setSelectedImageUrl(null)}
          >
            <button className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImageUrl} alt="full" className="max-w-full max-h-full object-contain rounded-lg" />
          </motion.div>
        )}

        {confirmConfig && (
          <ConfirmDialog 
            message={confirmConfig.message}
            onConfirm={confirmConfig.action}
            onCancel={() => setConfirmConfig(null)}
          />
        )}

        {showAuditHistoryCustId && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[2200] p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[32px] flex flex-col shadow-2xl relative max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-pastel-border flex items-center justify-between bg-amber-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Lịch sử khách hàng</h3>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">{customers.find(c => c.id === showAuditHistoryCustId)?.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAuditHistoryCustId(null)} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* Balance History Section */}
                <div>
                  <h4 className="text-[10px] font-black text-pastel-subtext uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Wallet className="w-3 h-3" /> Lịch sử số dư & Giao dịch
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 italic">Số dư khởi tạo</span>
                      <span className="text-sm font-black text-slate-700">
                        {(customers.find(c => c.id === showAuditHistoryCustId)?.initialDebt || 0).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {transactions
                      .filter(t => t.customerId === showAuditHistoryCustId)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(t => (
                        <div key={t.id} className="p-3 bg-white border border-pastel-border rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{t.date}</span>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{t.reason || "Giao dịch..."}</span>
                          </div>
                          <div className="text-right">
                            <span className={cn("text-xs font-black", t.type === 'Chi' ? "text-rose-500" : "text-emerald-500")}>
                              {t.type === 'Chi' ? "+" : "-"}{t.amount.toLocaleString('vi-VN')}
                            </span>
                            <div className="text-[8px] font-bold text-pastel-subtext uppercase">{t.type === 'Chi' ? "Khách nợ thêm" : "Khách đã trả"}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="h-[1px] bg-pastel-border/50" />
              </div>
              
              <div className="p-6 border-t border-pastel-border bg-pastel-bg/10">
                <button onClick={() => setShowAuditHistoryCustId(null)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl">ĐÓNG LỊCH SỬ</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showGroupManagement && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[2100] p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[32px] flex flex-col shadow-2xl relative max-h-[80vh]">
              <div className="p-6 border-b border-pastel-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Quản lý các nhóm</h3>
                </div>
                <button onClick={() => setShowGroupManagement(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 bg-pastel-bg/30 border-b border-pastel-border">
                <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-2 block">
                  {editingGroupId ? "Sửa tên nhóm" : "Tạo nhóm mới"}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)} 
                    placeholder="VD: Khách VIP, Khách sỉ..."
                    className="flex-1 bg-white border border-pastel-border rounded-xl p-4 text-sm font-bold outline-none focus:border-violet-400 transition-all font-sans"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (!newGroupName.trim()) return;
                      if (editingGroupId) {
                        onUpdateGroups(customerGroups.map(g => g.id === editingGroupId ? { ...g, name: newGroupName.trim() } : g));
                        setEditingGroupId(null);
                        setNewGroupName("");
                      } else {
                        const newGroup: CustomerGroup = { id: `group-${Date.now()}`, name: newGroupName.trim() };
                        onUpdateGroups([...customerGroups, newGroup]);
                        setNewGroupName("");
                      }
                    }}
                    className="px-6 bg-violet-500 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg shadow-violet-100"
                  >
                    {editingGroupId ? "CẬP NHẬT" : "THÊM"}
                  </button>
                </div>
                {editingGroupId && (
                  <button 
                    onClick={() => { setEditingGroupId(null); setNewGroupName(""); }}
                    className="text-[10px] font-bold text-rose-500 mt-2 ml-1"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {customerGroups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-4 bg-white border border-pastel-border rounded-2xl hover:bg-violet-50 transition-colors">
                    {editingGroupId === group.id ? (
                      <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (!newGroupName.trim()) return;
                            onUpdateGroups(customerGroups.map(g => g.id === group.id ? { ...g, name: newGroupName.trim() } : g));
                            setEditingGroupId(null);
                            setNewGroupName("");
                          } else if (e.key === 'Escape') {
                            setEditingGroupId(null);
                            setNewGroupName("");
                          }
                        }}
                        autoFocus
                        className="flex-1 mr-4 bg-white border border-violet-300 rounded-lg px-3 py-1 text-sm font-bold outline-none ring-2 ring-violet-100"
                      />
                    ) : (
                      <span className="font-bold text-slate-700">{group.name}</span>
                    )}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          if (editingGroupId === group.id) {
                            if (!newGroupName.trim()) return;
                            onUpdateGroups(customerGroups.map(g => g.id === group.id ? { ...g, name: newGroupName.trim() } : g));
                            setEditingGroupId(null);
                            setNewGroupName("");
                          } else {
                            setEditingGroupId(group.id);
                            setNewGroupName(group.name);
                          }
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          editingGroupId === group.id ? "text-emerald-500 hover:bg-emerald-100" : "text-violet-500 hover:bg-violet-100"
                        )}
                      >
                        {editingGroupId === group.id ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          setConfirmConfig({
                            message: `Bạn có chắc chắn muốn xóa nhóm "${group.name}"? Các khách hàng trong nhóm sẽ trở về trạng thái "Chưa phân nhóm".`,
                            action: () => {
                              onUpdateGroups(customerGroups.filter(g => g.id !== group.id));
                              onUpdateCustomers(customers.map(c => c.groupId === group.id ? { ...c, groupId: undefined } : c));
                              setConfirmConfig(null);
                            }
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {customerGroups.length === 0 && (
                  <div className="py-8 text-center text-pastel-subtext italic text-sm">
                    Chưa có nhóm nào được tạo
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showBulkImport && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[2100] p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Save className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Nhập nhanh danh sách</h3>
                </div>
                <button onClick={handleCancelBulk} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-2 block">Dán danh sách vào đây (mỗi dòng 1 khách)</label>
                  <textarea 
                    value={bulkText} 
                    onChange={(e) => setBulkText(e.target.value)} 
                    placeholder="2001 - QL - ..."
                    className="w-full h-60 bg-pastel-bg border border-pastel-border rounded-2xl p-4 text-xs font-medium outline-none focus:border-amber-400 transition-all no-scrollbar"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleCancelBulk} 
                  className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl active:scale-95"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleBulkImportAction} 
                  className="flex-1 py-4 font-black text-white bg-amber-500 rounded-2xl shadow-xl shadow-amber-100 active:scale-95 transition-all"
                >
                  Xác nhận nhập
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {cropperData && (
          <ImageCropperModal 
            image={cropperData} 
            onCropComplete={handleCropComplete} 
            onCancel={() => setCropperData(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
