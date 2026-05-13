import React, { useState, useMemo } from "react";
import { 
  X, 
  Wallet, 
  Plus, 
  Trash2, 
  Pencil, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  History as HistoryIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  Target,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  SortAsc,
  SortDesc,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LedgerAccount, 
  LedgerPurpose, 
  LedgerTransaction, 
  LedgerLog,
  Customer 
} from "../../types";
import { cn, getTimeFormatted, getTodayFormatted, getTodayIso, formatIsoToPretty } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "../Pagination";

interface LedgerModalProps {
  accounts: LedgerAccount[];
  purposes: LedgerPurpose[];
  transactions: LedgerTransaction[];
  logs: LedgerLog[];
  customers: Customer[];
  username: string;
  userPassword?: string;
  onUpdateAccounts: (accounts: LedgerAccount[]) => void;
  onUpdatePurposes: (purposes: LedgerPurpose[]) => void;
  onUpdateTransactions: (transactions: LedgerTransaction[]) => void;
  onUpdateLogs: (logs: LedgerLog[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onClose: () => void;
  onAddCardLog?: (customerName: string, action: string) => void;
  deviceView?: 'desktop' | 'mobile';
  isPage?: boolean;
  initialCustomerDebtId?: string | null;
}

export default function LedgerModal({
  accounts,
  purposes,
  transactions,
  logs,
  customers,
  username,
  userPassword = "",
  onUpdateAccounts,
  onUpdatePurposes,
  onUpdateTransactions,
  onUpdateLogs,
  onUpdateCustomers,
  onClose,
  onAddCardLog,
  deviceView = 'desktop',
  isPage = false,
  initialCustomerDebtId = null
}: LedgerModalProps) {
  const [activeView, setActiveView] = useState<'transactions' | 'accounts' | 'purposes' | 'logs'>('transactions');
  const [activeTab, setActiveTab] = useState<'Thu' | 'Chi'>('Thu');
  const [isCreatingAction, setIsCreatingAction] = useState<'Thu' | 'Chi' | null>(null);
  const [debtSort, setDebtSort] = useState<'balance-desc' | 'balance-asc' | 'name-asc' | 'name-desc'>('balance-desc');
  const [selectedDebtHistory, setSelectedDebtHistory] = useState<Customer | null>(null);

  React.useEffect(() => {
    // If initialCustomerDebtId is provided, we should probably redirect elsewhere, 
    // but for now we just avoid the crash. In KanbanApp, this will be handled.
  }, [initialCustomerDebtId, customers]);

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [showPurposeForm, setShowPurposeForm] = useState(false);
  const [editingPurposeId, setEditingPurposeId] = useState<string | null>(null);
  const [purposeName, setPurposeName] = useState("");

  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    accountId: "",
    purposeId: "",
    amount: "",
    date: getTodayIso(),
    reason: "",
    customerId: ""
  });

  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);
  const [pinInput, setPinInput] = useState<{message: string, action: () => void} | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);

  // Derived data
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
      const thu = transactions
        .filter(t => t.accountId === acc.id && t.type === 'Thu')
        .reduce((sum, t) => sum + t.amount, 0);
      const chi = transactions
        .filter(t => t.accountId === acc.id && t.type === 'Chi')
        .reduce((sum, t) => sum + t.amount, 0);
      balances[acc.id] = thu - chi;
    });
    return balances;
  }, [accounts, transactions]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (accountBalances[acc.id] || 0), 0);
  }, [accounts, accountBalances]);

  const sortedTransactions = useMemo(() => {
    return [...transactions]
      .filter(t => t.type === activeTab)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [transactions, activeTab]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeView, activeTab, debtSort]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return accounts.slice(start, start + pageSize);
  }, [accounts, currentPage, pageSize]);

  const paginatedPurposes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return purposes.slice(start, start + pageSize);
  }, [purposes, currentPage, pageSize]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, currentPage, pageSize]);

  const addLog = (action: string, targetType: LedgerLog['targetType'], message: string) => {
    const newLog: LedgerLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: `${getTodayFormatted(true)} ${getTimeFormatted()}`,
      user: username,
      action,
      targetType,
      message
    };
    onUpdateLogs([newLog, ...logs]);
  };

  const cleanAmount = (val: string) => {
    return val.replace(/\./g, "").replace(/,/g, "");
  };

  const handlePinConfirm = async () => {
    // Check against passed userPassword or default '1234'
    const actualPassword = userPassword || "1234";
    let isValid = pinValue === actualPassword;
    
    if (!isValid) {
      try {
        const response = await fetch("/api/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password: pinValue })
        });
        isValid = response.ok;
      } catch (err) {
        isValid = false;
      }
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

  // Account Handlers
  const handleSaveAccount = () => {
    if (!accountName.trim() || !accountNumber.trim()) return;
    
    confirmAction(`Bạn có chắc muốn ${editingAccountId ? 'cập nhật' : 'tạo'} tài khoản này?`, () => {
      if (editingAccountId) {
        const updated = accounts.map(a => a.id === editingAccountId ? { ...a, name: accountName, accountNumber } : a);
        onUpdateAccounts(updated);
        addLog("Sửa", "Tài khoản", `Sửa tài khoản ${accountName}`);
      } else {
        const newAcc: LedgerAccount = { id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: accountName, accountNumber };
        onUpdateAccounts([...accounts, newAcc]);
        addLog("Tạo", "Tài khoản", `Tạo tài khoản ${accountName}`);
      }
      resetAccountForm();
    });
  };

  const resetAccountForm = () => {
    setShowAccountForm(false);
    setEditingAccountId(null);
    setAccountName("");
    setAccountNumber("");
  };

  const handleEditAccount = (acc: LedgerAccount) => {
    confirmAction(`Bạn có chắc muốn sửa tài khoản ${acc.name}?`, () => {
      requirePin("Nhập mật khẩu để sửa tài khoản", () => {
        setEditingAccountId(acc.id);
        setAccountName(acc.name);
        setAccountNumber(acc.accountNumber);
        setShowAccountForm(true);
      });
    });
  };

  const handleDeleteAccount = (id: string, name: string) => {
    confirmAction(`Bạn có chắc muốn xóa tài khoản ${name}?`, () => {
      requirePin(`Nhập mật khẩu để xóa tài khoản ${name}`, () => {
        onUpdateTransactions(transactions.filter(t => t.accountId !== id));
        onUpdateAccounts(accounts.filter(a => a.id !== id));
        addLog("Xóa", "Tài khoản", `Xóa tài khoản ${name} và các giao dịch liên quan`);
      });
    });
  };

  // Purpose Handlers
  const handleSavePurpose = () => {
    if (!purposeName.trim()) return;
    confirmAction(`Bạn có chắc muốn ${editingPurposeId ? 'cập nhật' : 'tạo'} mục đích này?`, () => {
      if (editingPurposeId) {
        const updated = purposes.map(p => p.id === editingPurposeId ? { ...p, name: purposeName } : p);
        onUpdatePurposes(updated);
        addLog("Sửa", "Mục đích", `Sửa mục đích ${purposeName}`);
      } else {
        const newPurp: LedgerPurpose = { id: `purp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: purposeName, type: 'Thu' }; // Type is ignored but kept for compatibility
        onUpdatePurposes([...purposes, newPurp]);
        addLog("Tạo", "Mục đích", `Tạo mục đích ${purposeName}`);
      }
      resetPurposeForm();
    });
  };

  const resetPurposeForm = () => {
    setShowPurposeForm(false);
    setEditingPurposeId(null);
    setPurposeName("");
  };

  const handleEditPurpose = (p: LedgerPurpose) => {
    confirmAction(`Bạn có chắc muốn sửa mục đích ${p.name}?`, () => {
      requirePin("Nhập mật khẩu để sửa mục đích", () => {
        setEditingPurposeId(p.id);
        setPurposeName(p.name);
        setShowPurposeForm(true);
      });
    });
  };

  const handleDeletePurpose = (id: string, name: string) => {
    confirmAction(`Bạn có chắc muốn xóa mục đích ${name}?`, () => {
      requirePin(`Nhập mật khẩu để xóa mục đích ${name}`, () => {
        onUpdatePurposes(purposes.filter(p => p.id !== id));
        addLog("Xóa", "Mục đích", `Xóa mục đích ${name}`);
      });
    });
  };

  // Transaction Handlers
  const handleSaveTransaction = () => {
    const { accountId, purposeId, amount: rawAmount, date, reason, customerId } = transactionForm;
    const amount = cleanAmount(rawAmount);
    if (!accountId || !purposeId || !amount || !date) return;
    
    confirmAction(`Xác nhận ${editingTransactionId ? 'cập nhật' : 'tạo'} phiếu ${isCreatingAction}?`, () => {
      const parsedAmount = parseFloat(amount);
      if (editingTransactionId) {
        const updated = transactions.map(t => t.id === editingTransactionId ? {
          ...t,
          accountId,
          purposeId,
          amount: parsedAmount,
          date,
          reason,
          customerId: purposes.find(p => p.id === purposeId)?.name === 'Khách' ? customerId : undefined
        } : t);
        onUpdateTransactions(updated);
        addLog("Sửa", isCreatingAction === 'Thu' ? 'Phiếu Thu' : 'Phiếu Chi', `Sửa phiếu ${isCreatingAction} ${parsedAmount.toLocaleString('vi-VN')}`);
      } else {
        const newTx: LedgerTransaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          accountId,
          purposeId,
          amount: parsedAmount,
          date,
          reason,
          type: isCreatingAction!,
          createdAt: Date.now(),
          customerId: purposes.find(p => p.id === purposeId)?.name === 'Khách' ? customerId : undefined
        };
        onUpdateTransactions([newTx, ...transactions]);
        const logMsg = `Tạo phiếu ${isCreatingAction} ${parsedAmount.toLocaleString('vi-VN')}`;
        addLog("Tạo", isCreatingAction === 'Thu' ? 'Phiếu Thu' : 'Phiếu Chi', logMsg);
        
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          onAddCardLog?.(customer.name, logMsg);
        }
      }
      setIsCreatingAction(null);
      setEditingTransactionId(null);
      setTransactionForm({ accountId: "", purposeId: "", amount: "", date: getTodayIso(), reason: "", customerId: "" });
    });
  };

  const handleEditTransaction = (tx: LedgerTransaction) => {
    confirmAction(`Bạn có chắc muốn sửa phiếu ${tx.type} này?`, () => {
      requirePin(`Nhập mật khẩu để sửa phiếu ${tx.type}`, () => {
        setTransactionForm({
          accountId: tx.accountId,
          purposeId: tx.purposeId,
          amount: tx.amount.toString(),
          date: tx.date,
          reason: tx.reason || "",
          customerId: tx.customerId || ""
        });
        setEditingTransactionId(tx.id);
        setIsCreatingAction(tx.type);
      });
    });
  };

  const handleDeleteTransaction = (tx: LedgerTransaction) => {
    confirmAction(`Bạn có chắc muốn xóa phiếu ${tx.type} này?`, () => {
      requirePin(`Nhập mật khẩu để xóa phiếu ${tx.type}`, () => {
        onUpdateTransactions(transactions.filter(t => t.id !== tx.id));
        addLog("Xóa", tx.type === 'Thu' ? 'Phiếu Thu' : 'Phiếu Chi', `Xóa phiếu ${tx.type} ${tx.amount.toLocaleString('vi-VN')}`);
      });
    });
  };

  const confirmAction = (message: string, action: () => void) => {
    setConfirmConfig({ message, action: () => { action(); setConfirmConfig(null); } });
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Thu Chi</h2>
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Quản lý tài chính</p>
            </div>
          </div>
        </div>
      </div>

        {/* Global Tabs */}
        <div className="flex bg-white border-b border-pastel-border p-2 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveView('transactions')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeView === 'transactions' ? "bg-rose-500 text-white shadow-lg" : "text-pastel-subtext hover:bg-pastel-bg"
            )}
          >
            <Search className="w-4 h-4" /> Thu Chi
          </button>
          <button 
            onClick={() => setActiveView('accounts')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeView === 'accounts' ? "bg-emerald-500 text-white shadow-lg" : "text-pastel-subtext hover:bg-pastel-bg"
            )}
          >
            <CreditCard className="w-4 h-4" /> Tài khoản
          </button>
          <button 
            onClick={() => setActiveView('purposes')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeView === 'purposes' ? "bg-amber-500 text-white shadow-lg" : "text-pastel-subtext hover:bg-pastel-bg"
            )}
          >
            <Target className="w-4 h-4" /> Mục đích
          </button>
          <button 
            onClick={() => setActiveView('logs')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
              activeView === 'logs' ? "bg-slate-700 text-white shadow-lg" : "text-pastel-subtext hover:bg-pastel-bg"
            )}
          >
            <HistoryIcon className="w-4 h-4" /> Lịch sử
          </button>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'transactions' && (
            <>
              {/* Balances Summary */}
              <div className="p-4 bg-pastel-bg/20 border-b border-pastel-border">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm font-black text-slate-800">
                    <span className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded-full text-[10px]">1</span>
                    <span className="uppercase tracking-widest text-emerald-600">Tổng số dư:</span>
                    <span className="text-base">{totalBalance.toLocaleString('vi-VN')}</span>
                  </div>
                  {accounts.map((acc, idx) => (
                    <div key={acc.id} className="flex items-center gap-3 text-sm font-black text-slate-700">
                      <span className="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full text-[10px]">{idx + 1}</span>
                      <span className="truncate max-w-[200px]">{acc.name}:</span>
                      <span className={cn(
                        "text-base",
                        accountBalances[acc.id] >= 0 ? "text-slate-800" : "text-rose-500"
                      )}>
                        {accountBalances[acc.id].toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions Header & Tabs */}
              <div className="p-4 bg-pastel-bg/30 border-b border-pastel-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-white rounded-xl p-1 border border-pastel-border shadow-sm">
                  <button 
                    onClick={() => setActiveTab('Thu')}
                    className={cn(
                      "px-8 py-2 rounded-lg font-black text-sm transition-all",
                      activeTab === 'Thu' ? "bg-emerald-500 text-white shadow-md" : "text-pastel-subtext"
                    )}
                  >
                    THU
                  </button>
                  <button 
                    onClick={() => setActiveTab('Chi')}
                    className={cn(
                      "px-8 py-2 rounded-lg font-black text-sm transition-all",
                      activeTab === 'Chi' ? "bg-rose-500 text-white shadow-md" : "text-pastel-subtext"
                    )}
                  >
                    CHI
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCreatingAction('Thu')}
                    className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" /> TẠO THU
                  </button>
                  <button 
                    onClick={() => setIsCreatingAction('Chi')}
                    className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-black text-sm shadow-lg shadow-rose-100 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" /> TẠO CHI
                  </button>
                </div>
              </div>

              {/* Transaction List */}
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest px-4">
                      <th className="pb-2 pl-4 w-12 text-center">STT</th>
                      <th className="pb-2">Mục đích</th>
                      <th className="pb-2">Người / Khách</th>
                      <th className="pb-2">Số tiền</th>
                      <th className="pb-2">Tài khoản</th>
                      <th className="pb-2">Thời gian</th>
                      <th className="pb-2">Lý do</th>
                      <th className="pb-2 pr-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-4">
                    {paginatedTransactions.map((tx, idx) => {
                      const account = accounts.find(a => a.id === tx.accountId);
                      const purpose = purposes.find(p => p.id === tx.purposeId);
                      const customer = tx.customerId ? customers.find(c => c.id === tx.customerId) : null;
                      
                      return (
                        <tr key={tx.id} className="bg-white hover:bg-slate-50 transition-colors group">
                          <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-pastel-border text-center font-black text-pastel-subtext text-xs">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-4 border-y border-pastel-border text-sm font-bold text-slate-800">
                             {purpose?.name || "Đã xóa"}
                          </td>
                          <td className="py-4 border-y border-pastel-border">
                            {purpose?.name === 'Khách' ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                                  {customer?.imageUrl ? <img src={customer.imageUrl} className="w-full h-full object-cover rounded-full" /> : <User className="w-4 h-4 text-rose-400" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{customer?.name || "Không tìm thấy"}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-pastel-subtext">-</span>
                            )}
                          </td>
                          <td className={cn(
                            "py-4 border-y border-pastel-border font-black text-sm",
                            tx.type === 'Thu' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {tx.type === 'Thu' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-4 border-y border-pastel-border text-xs font-bold text-slate-600">
                            {account ? account.name : "Đã xóa"}
                          </td>
                          <td className="py-4 border-y border-pastel-border text-xs font-medium text-pastel-subtext">
                            {formatIsoToPretty(tx.date)}
                          </td>
                          <td className="py-4 border-y border-pastel-border text-xs font-medium italic text-pastel-subtext max-w-[150px] truncate">
                            {tx.reason}
                          </td>
                          <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-pastel-border text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleEditTransaction(tx)}
                                className="p-2 text-indigo-400 hover:text-indigo-600 active:scale-90"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(tx)}
                                className="p-2 text-rose-400 hover:text-rose-600 active:scale-90"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sortedTransactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-pastel-subtext italic">
                    <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                    <p>Chưa có dữ liệu {activeTab}</p>
                  </div>
                )}
              </div>
              {sortedTransactions.length > 0 && (
                <div className="border-t border-pastel-border bg-white mt-auto">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(sortedTransactions.length / pageSize)}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    totalItems={sortedTransactions.length}
                  />
                </div>
              )}
            </>
          )}

          {activeView === 'accounts' && (
            <div className="p-6 overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" /> Danh sách tài khoản
                </h3>
                <button 
                  onClick={() => setShowAccountForm(true)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-100"
                >
                  <Plus className="w-4 h-4" /> THÊM TÀI KHOẢN
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {paginatedAccounts.map(acc => (
                  <div key={acc.id} className="p-5 bg-pastel-bg/50 border border-pastel-border rounded-2xl relative group hover:border-emerald-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditAccount(acc)}
                          className="p-2 bg-white rounded-lg text-emerald-500 hover:bg-emerald-50 shadow-sm"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          className="p-2 bg-white rounded-lg text-rose-500 hover:bg-rose-50 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base mb-1">{acc.name}</h4>
                      <p className="text-xs font-mono font-bold text-pastel-subtext tracking-widest">{acc.accountNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
              {accounts.length > 0 && (
                <div className="border-t border-pastel-border pt-4 mt-auto">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(accounts.length / pageSize)}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    totalItems={accounts.length}
                  />
                </div>
              )}
            </div>
          )}

          {activeView === 'purposes' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-pastel-border bg-white shrink-0">
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" /> Mục đích
                </h3>
                <button 
                  onClick={() => setShowPurposeForm(true)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-100"
                >
                  <Plus className="w-4 h-4" /> THÊM MỤC ĐÍCH
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <div className="bg-white border border-pastel-border rounded-[32px] overflow-hidden shadow-sm">
                  <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest shrink-0">
                    <div className="w-12 text-center">STT</div>
                    <div className="flex-1">Tên mục đích</div>
                    <div className="w-24 text-right">Thao tác</div>
                  </div>
                  <div className="divide-y divide-pastel-border/30">
                    {paginatedPurposes.map((p, idx) => {
                      const isMandatory = p.name === 'Khách' || p.name === 'Chỉnh số dư';
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-pastel-bg/30 transition-colors">
                          <span className="w-12 text-center text-xs font-black text-pastel-subtext">{(currentPage - 1) * pageSize + idx + 1}</span>
                          <div className="flex-1">
                            <h4 className="font-black text-slate-800 text-sm">
                              {p.name} {isMandatory && <span className="text-rose-500">*</span>}
                            </h4>
                          </div>
                          <div className="w-24 flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity-none">
                            {!isMandatory ? (
                              <>
                                <button 
                                  onClick={() => handleEditPurpose(p)}
                                  className="p-2 text-amber-600 bg-amber-50 rounded-lg shadow-sm border border-amber-100 active:scale-90"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePurpose(p.id, p.name)}
                                  className="p-2 text-rose-500 bg-rose-50 rounded-lg shadow-sm border border-rose-100 active:scale-90"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-pastel-subtext uppercase mr-2 italic">Hệ thống</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {purposes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-pastel-border">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil(purposes.length / pageSize)}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                      totalItems={purposes.length}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'logs' && (
            <div className="p-6 overflow-y-auto no-scrollbar">
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2 mb-6">
                <HistoryIcon className="w-5 h-5 text-slate-600" /> Lịch sử hành động
              </h3>
              <div className="space-y-3 pb-4">
                {paginatedLogs.map(log => (
                  <div key={log.id} className="flex gap-4 p-4 bg-pastel-bg/40 rounded-2xl border border-pastel-border/50 items-start">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-pastel-border">
                      <Clock className="w-4 h-4 text-pastel-subtext" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3 h-3" /> {log.user}
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-black uppercase">{log.targetType}</span>
                        </span>
                        <span className="text-[10px] font-medium text-pastel-subtext font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-600">{log.message}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-20 text-pastel-subtext italic">Chưa có lịch sử</div>
                )}
              </div>
              {logs.length > 0 && (
                <div className="border-t border-pastel-border pt-4 mt-auto">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(logs.length / pageSize)}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    totalItems={logs.length}
                  />
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Transaction Creation Overlay */}
        <AnimatePresence>
          {isCreatingAction && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-[1300] border-l border-pastel-border"
            >
              <div className="p-6 border-b border-pastel-border flex items-center justify-between bg-pastel-bg/30">
                <h3 className={cn(
                  "text-lg font-black uppercase tracking-wider",
                  isCreatingAction === 'Thu' ? "text-emerald-500" : "text-rose-500"
                )}>
                  {editingTransactionId ? 'Sửa' : 'Tạo'} phiếu {isCreatingAction}
                </h3>
                <button onClick={() => { setIsCreatingAction(null); setEditingTransactionId(null); }} className="p-2 hover:bg-rose-50 rounded-xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Chọn tài khoản</label>
                  <select 
                    value={transactionForm.accountId}
                    onChange={(e) => setTransactionForm({ ...transactionForm, accountId: e.target.value })}
                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-300"
                  >
                    <option value="">-- Chọn tài khoản --</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.accountNumber})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Mục đích</label>
                  <select 
                    value={transactionForm.purposeId}
                    onChange={(e) => setTransactionForm({ ...transactionForm, purposeId: e.target.value })}
                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-300"
                  >
                    <option value="">-- Chọn mục đích --</option>
                    {purposes
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {purposes.find(p => p.id === transactionForm.purposeId)?.name === 'Khách' && (
                  <div>
                    <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Chọn Khách hàng</label>
                    <select 
                      value={transactionForm.customerId}
                      onChange={(e) => setTransactionForm({ ...transactionForm, customerId: e.target.value })}
                      className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none focus:border-rose-300"
                    >
                      <option value="">-- Chọn khách --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Số tiền</label>
                  <input 
                    type="text"
                    value={transactionForm.amount ? Number(transactionForm.amount).toLocaleString('vi-VN') : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setTransactionForm({ ...transactionForm, amount: val });
                    }}
                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-4 text-xl font-black text-emerald-600 outline-none focus:border-emerald-300"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Ngày</label>
                  <input 
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Lý do / Ghi chú</label>
                  <textarea 
                    value={transactionForm.reason}
                    onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })}
                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-medium h-24 outline-none focus:border-emerald-300"
                    placeholder="Nội dung chi tiết..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-pastel-border bg-pastel-bg/10">
                <button 
                  onClick={handleSaveTransaction}
                  className={cn(
                    "w-full py-4 rounded-2xl text-white font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                    isCreatingAction === 'Thu' ? "bg-emerald-500 shadow-emerald-100" : "bg-rose-500 shadow-rose-100"
                  )}
                >
                  <Save className="w-5 h-5" /> {editingTransactionId ? 'CẬP NHẬT' : 'TẠO PHIẾU'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Modal Popups (Forms, Pin, Confirm) */}
        <AnimatePresence>
          {showAccountForm && (
            <motion.div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[1400] p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
                <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-500" /> {editingAccountId ? 'Sửa' : 'Thêm'} tài khoản
                </h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Tên chủ tài khoản</label>
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Số tài khoản</label>
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none font-mono tracking-wider" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetAccountForm} className="flex-1 py-3 font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl active:scale-95 transition-all">Hủy</button>
                  <button onClick={handleSaveAccount} className="flex-1 py-3 font-black text-white bg-emerald-500 rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all">Lưu</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showPurposeForm && (
            <motion.div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[1400] p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
                <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <Target className="w-6 h-6 text-amber-500" /> {editingPurposeId ? 'Sửa' : 'Thêm'} mục đích
                </h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[11px] font-black text-pastel-subtext uppercase tracking-widest ml-1 mb-1.5 block">Tên mục đích</label>
                    <input type="text" value={purposeName} onChange={(e) => setPurposeName(e.target.value)} className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-sm font-bold outline-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetPurposeForm} className="flex-1 py-3 font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl active:scale-95 transition-all">Hủy</button>
                  <button onClick={handleSavePurpose} className="flex-1 py-3 font-black text-white bg-amber-500 rounded-xl shadow-lg shadow-amber-100 active:scale-95 transition-all">Lưu</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {pinInput && (
            <motion.div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[2000] p-4 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1, x: pinError ? [0, -10, 10, -5, 5, 0] : 0 }} 
                className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center relative"
              >
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Yêu cầu xác minh</h3>
                <p className="text-sm font-medium text-pastel-subtext mb-6">Nhập mật khẩu tài khoản để thực hiện hành động này</p>
                <input 
                  type="password"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePinConfirm()}
                  className={cn(
                    "w-full bg-pastel-bg border-4 rounded-2xl p-4 text-center text-sm font-black outline-none transition-all mb-6",
                    pinError ? "border-red-500" : "border-pastel-border focus:border-rose-400"
                  )}
                  placeholder="Mật khẩu"
                  autoFocus
                />
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

          {confirmConfig && (
            <ConfirmDialog 
              message={confirmConfig.message}
              onConfirm={confirmConfig.action}
              onCancel={() => setConfirmConfig(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
}
