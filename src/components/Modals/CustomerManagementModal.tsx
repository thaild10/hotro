import React, { useState, useMemo } from "react";
import { X, Plus, Image as ImageIcon, Trash2, Pencil, ChevronLeft, ChevronRight, User, Save, Users, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer, ImageCompressionSettings, CustomerGroup, LedgerTransaction } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "../Pagination";
import { uploadToFirebase } from "../../lib/imageUtils";

import { DEFAULT_CUSTOMERS_TEXT } from "../../constants/defaultCustomers";
import ImageCropperModal from "./ImageCropperModal";

interface CustomerManagementModalProps {
  customers: Customer[];
  customerGroups: CustomerGroup[];
  transactions: LedgerTransaction[];
  onClose: () => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateGroups: (groups: CustomerGroup[]) => void;
  onViewDebtHistory: (customerId: string) => void;
  compressionSettings: ImageCompressionSettings;
  deviceView?: 'desktop' | 'mobile';
}

const ITEMS_PER_PAGE = 10;

export default function CustomerManagementModal({ 
  customers, 
  customerGroups,
  transactions,
  onClose, 
  onUpdateCustomers,
  onUpdateGroups,
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
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [cropperData, setCropperData] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState(DEFAULT_CUSTOMERS_TEXT);
  const [newGroupName, setNewGroupName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(customers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage, pageSize]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

    if (editingId) {
      const updated = customers.map(c => 
        c.id === editingId ? { ...c, name: name.trim(), imageUrl, groupId: selectedGroupId || undefined, city: city.trim() || undefined, district: district.trim() || undefined, address: address.trim() || undefined } : c
      );
      onUpdateCustomers(updated);
      setEditingId(null);
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: name.trim(),
        imageUrl,
        groupId: selectedGroupId || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        address: address.trim() || undefined
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
  };

  const handleEdit = (customer: Customer) => {
    setName(customer.name);
    setImageUrl(customer.imageUrl || "");
    setSelectedGroupId(customer.groupId || "");
    setCity(customer.city || "");
    setDistrict(customer.district || "");
    setAddress(customer.address || "");
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

  const getCustomerBalance = (customerId: string) => {
    const customerTx = transactions.filter(t => t.customerId === customerId);
    const thu = customerTx.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
    const chi = customerTx.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0);
    return thu - chi;
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
    if (name.trim() || imageUrl) {
      setConfirmConfig({
        message: "Bạn có chắc chắn muốn hủy? Dữ liệu đang nhập sẽ bị mất.",
        action: () => {
          setName("");
          setImageUrl("");
          setSelectedGroupId("");
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
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Danh sách & Thông tin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
        {/* Create Area Toggle */}
        {!showCustomerForm && (
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
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Họ và tên khách hàng..."
                    className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/5 transition-all shadow-sm"
                  />
                  <select 
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full md:w-32 bg-white border border-rose-100 rounded-xl px-2 py-3.5 text-xs font-bold outline-none"
                  >
                    <option value="">Nhóm...</option>
                    {customerGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
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
            <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0">
            <div className="w-10 text-center">STT</div>
            <div className="flex-1">Thông tin</div>
            <div className="w-32 text-center">Số dư</div>
            <div className="w-24 text-right">Thao tác</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {paginatedCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-4 p-4 hover:bg-pastel-bg/30 border-b border-pastel-border/30 last:border-0 transition-colors">
                <span className="text-xs font-black text-pastel-subtext w-10 text-center">
                  {(currentPage - 1) * pageSize + index + 1}
                </span>
                
                <div className="flex-1 flex items-center gap-4">
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
                    {(customer.address || customer.district || customer.city) && (
                      <span className="block w-full text-[10px] text-slate-500 truncate leading-relaxed">
                        {[customer.address, customer.district, customer.city].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="block text-[9px] font-bold text-pastel-subtext uppercase tracking-tight mt-0.5">
                      {customerGroups.find(g => g.id === customer.groupId)?.name || "Chưa phân nhóm"}
                    </span>
                  </div>
                  <div className="w-32 text-center">
                    <span className={cn(
                      "font-black text-sm",
                      getCustomerBalance(customer.id) >= 0 ? "text-slate-700" : "text-rose-500"
                    )}>
                      {getCustomerBalance(customer.id).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 shrink-0 justify-end w-24",
                    editingId === customer.id && "opacity-20 pointer-events-none"
                  )}>
                    <button 
                      onClick={() => onViewDebtHistory(customer.id)}
                      className="p-2.5 text-amber-500 bg-white border border-amber-100 rounded-xl shadow-sm hover:bg-amber-50 active:scale-90 transition-all cursor-pointer relative z-10"
                      title="Lịch sử công nợ"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(customer)}
                      className="p-2.5 text-violet-500 bg-white border border-violet-100 rounded-xl shadow-sm hover:bg-violet-50 active:scale-90 transition-all cursor-pointer relative z-10"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="p-2.5 text-rose-500 bg-white border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 active:scale-90 transition-all cursor-pointer relative z-10"
                    >
                      <Trash2 className="w-4 h-4" />
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
                    <span className="font-bold text-slate-700">{group.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setNewGroupName(group.name);
                        }}
                        className="p-2 text-violet-500 hover:bg-violet-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
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
