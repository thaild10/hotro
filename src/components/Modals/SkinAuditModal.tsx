import React, { useState, useMemo } from "react";
import { X, Search, Calendar, History, ArrowDownAZ, ArrowUpZA, Pencil, Trash2, Save, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer, SkinAuditEntry, SkinAuditLog } from "../../types";
import { cn, getTodayFormatted, getTimeFormatted } from "../../lib/utils";
import { Pagination } from "../Pagination";

interface SkinAuditModalProps {
  customers: Customer[];
  skinAudits: SkinAuditEntry[];
  skinAuditLogs: SkinAuditLog[];
  username: string;
  onUpdateAudits: (audits: SkinAuditEntry[]) => void;
  onUpdateLogs: (logs: SkinAuditLog[]) => void;
  onClose: () => void;
  deviceView?: 'desktop' | 'mobile';
}

export default function SkinAuditModal({ 
  customers, 
  skinAudits, 
  skinAuditLogs,
  username, 
  onUpdateAudits, 
  onUpdateLogs,
  onClose,
  deviceView = 'desktop'
}: SkinAuditModalProps) {
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState<'a-z' | 'z-a' | 'last-audit' | 'not-audited-this-month'>('last-audit');
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAudit, setPendingAudit] = useState<{ customerId: string, month: string, type: 'Khám' | 'Kiểm tra' } | null>(null);
  const [editDate, setEditDate] = useState("");

  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
  
  const getMonths = () => {
    const months = [];
    for (let i = -1; i <= 1; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({
        value: d.toISOString().slice(0, 7),
        label: `T${d.getMonth() + 1}`
      });
    }
    return months;
  };

  const months = useMemo(getMonths, []);

  const sortedCustomers = useMemo(() => {
    let list = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    if (sortType === 'a-z') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'z-a') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortType === 'last-audit') {
      list.sort((a, b) => {
        const lastA = [...skinAudits].reverse().find(e => e.customerId === a.id)?.createdAt || '';
        const lastB = [...skinAudits].reverse().find(e => e.customerId === b.id)?.createdAt || '';
        return lastB.localeCompare(lastA);
      });
    } else if (sortType === 'not-audited-this-month') {
      list.sort((a, b) => {
        const hasA = skinAudits.some(e => e.customerId === a.id && e.month === currentMonth && e.type === 'Khám');
        const hasB = skinAudits.some(e => e.customerId === b.id && e.month === currentMonth && e.type === 'Khám');
        if (hasA && !hasB) return 1;
        if (!hasA && hasB) return -1;
        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [customers, search, sortType, skinAudits, currentMonth]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedCustomers.length / pageSize);

  const handleAction = (customerId: string, month: string, type: 'Khám' | 'Kiểm tra', date: string) => {
    const newEntry: SkinAuditEntry = {
      id: `audit-${Date.now()}`,
      customerId,
      month,
      type,
      date,
      createdBy: username,
      createdAt: new Date().toISOString()
    };
    onUpdateAudits([...skinAudits, newEntry]);

    const newLog: SkinAuditLog = {
      id: `log-${Date.now()}`,
      customerId,
      action: 'create',
      type,
      month,
      date,
      user: username,
      timestamp: new Date().toISOString()
    };
    onUpdateLogs([newLog, ...skinAuditLogs]);
  };

  const handleDelete = (id: string) => {
    const entry = skinAudits.find(e => e.id === id);
    if (!entry) return;

    onUpdateAudits(skinAudits.filter(e => e.id !== id));

    const newLog: SkinAuditLog = {
      id: `log-${Date.now()}`,
      customerId: entry.customerId,
      action: 'delete',
      type: entry.type,
      month: entry.month,
      date: entry.date,
      user: username,
      timestamp: new Date().toISOString()
    };
    onUpdateLogs([newLog, ...skinAuditLogs]);
  };

  const handleUpdateDate = (id: string, newDate: string) => {
    const entry = skinAudits.find(e => e.id === id);
    if (!entry) return;

    onUpdateAudits(skinAudits.map(e => e.id === id ? { ...e, date: newDate } : e));

    const newLog: SkinAuditLog = {
      id: `log-${Date.now()}`,
      customerId: entry.customerId,
      action: 'update',
      type: entry.type,
      month: entry.month,
      date: newDate,
      user: username,
      timestamp: new Date().toISOString()
    };
    onUpdateLogs([newLog, ...skinAuditLogs]);
    setEditingId(null);
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
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-100">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Kiểm tra da</h2>
              <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">Lịch khám khách hàng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/50 px-6 py-4 flex flex-wrap items-center gap-4 border-b border-pastel-border shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pastel-subtext" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên khách hàng..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm font-bold border border-pastel-border outline-none focus:border-teal-400 transition-colors shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-pastel-subtext whitespace-nowrap">Sắp xếp:</span>
          <div className="flex bg-white rounded-xl p-1 border border-pastel-border shadow-sm">
            <button 
              onClick={() => setSortType('last-audit')}
              className={cn("px-2 py-1 rounded-lg text-[10px] font-black transition-all", sortType === 'last-audit' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
            >
              Gần nhất
            </button>
            <button 
              onClick={() => setSortType('a-z')}
              className={cn("p-1 rounded-lg text-xs font-black transition-all", sortType === 'a-z' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
            >
              <ArrowDownAZ className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSortType('z-a')}
              className={cn("p-1 rounded-lg text-xs font-black transition-all", sortType === 'z-a' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
            >
              <ArrowUpZA className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSortType('not-audited-this-month')}
              className={cn("px-2 py-1 rounded-lg text-[10px] font-black transition-all", sortType === 'not-audited-this-month' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
            >
              Chưa khám
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
        <div className="bg-white rounded-[24px] border border-pastel-border flex-1 flex flex-col overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="flex items-center px-4 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black uppercase tracking-widest text-pastel-subtext">
            <div className="w-10 text-center">STT</div>
            <div className="flex-1 px-4">Tên khách</div>
            {months.map(m => (
              <div key={m.value} className="w-24 sm:w-32 text-center border-l border-pastel-border/50">{m.label}</div>
            ))}
            <div className="w-16 sm:w-24 text-center border-l border-pastel-border/50">L.Sử</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {paginatedCustomers.map((customer, idx) => {
              return (
                <div key={customer.id} className="flex items-center px-4 py-4 border-b border-pastel-border/30 hover:bg-pastel-bg/20 transition-colors">
                  <div className="w-10 text-center text-xs font-black text-pastel-subtext">{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div className="flex-1 px-4">
                    <div className="font-black text-slate-700 text-sm">{customer.name}</div>
                  </div>

                  {months.map(month => {
                    const examEntry = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Khám');
                    const checkEntry = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Kiểm tra');

                    return (
                      <div key={month.value} className="w-24 sm:w-32 flex flex-col items-center justify-center gap-1.5 border-l border-pastel-border/10">
                        {examEntry ? (
                          <div className="flex flex-col items-center gap-1 group">
                            <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                              {examEntry.date}
                            </span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingId(examEntry.id); setEditDate(examEntry.date); }} className="p-1 bg-white border border-teal-100 rounded text-teal-500 shadow-sm"><Pencil className="w-2 h-2" /></button>
                              <button onClick={() => handleDelete(examEntry.id)} className="p-1 bg-white border border-rose-100 rounded text-rose-500 shadow-sm"><Trash2 className="w-2 h-2" /></button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setPendingAudit({ customerId: customer.id, month: month.value, type: 'Khám' });
                              setEditDate(getTodayFormatted().slice(0, 5));
                            }}
                            className="text-[9px] font-black text-pastel-subtext px-2 py-1 rounded-lg border border-pastel-border hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all active:scale-95"
                          >
                            Khám
                          </button>
                        )}

                        {!examEntry && (
                          checkEntry ? (
                            <div className="flex flex-col items-center gap-1 group">
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                {checkEntry.date}
                              </span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingId(checkEntry.id); setEditDate(checkEntry.date); }} className="p-1 bg-white border border-amber-100 rounded text-amber-500 shadow-sm"><Pencil className="w-2 h-2" /></button>
                                <button onClick={() => handleDelete(checkEntry.id)} className="p-1 bg-white border border-rose-100 rounded text-rose-500 shadow-sm"><Trash2 className="w-2 h-2" /></button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setPendingAudit({ customerId: customer.id, month: month.value, type: 'Kiểm tra' });
                                setEditDate(getTodayFormatted().slice(0, 5));
                              }}
                              className="text-[9px] font-black text-pastel-subtext px-1 py-1 rounded-lg border border-dashed border-pastel-border hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all active:scale-95 w-full max-w-[60px]"
                            >
                              K.tra
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}

                  <div className="w-16 sm:w-24 border-l border-pastel-border/10 flex items-center justify-center">
                     <button 
                       onClick={() => setShowHistoryId(showHistoryId === customer.id ? null : customer.id)}
                       className="p-2 bg-pastel-bg text-pastel-subtext rounded-xl hover:bg-teal-50 hover:text-teal-500 transition-colors"
                       title="Lịch sử"
                     >
                       <History className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {sortedCustomers.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              totalItems={sortedCustomers.length}
            />
          )}
        </div>
      </div>

      {/* Date Entry/Edit Popups - These stay as overlays */}
        {(editingId || pendingAudit) && (
          <div className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border-4 border-teal-500/20"
            >
              <h3 className="text-sm font-black text-slate-800 uppercase mb-4 text-center">
                {pendingAudit ? `Nhập ngày ${pendingAudit.type}` : 'Sửa ngày'}
              </h3>
              <input 
                type="text"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                placeholder="dd.mm"
                className="w-full px-4 py-4 bg-pastel-bg rounded-2xl text-center font-black text-2xl border-2 border-transparent focus:border-teal-500 outline-none transition-all mb-6 text-teal-600"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => { setEditingId(null); setPendingAudit(null); setEditDate(""); }} 
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  Huỷ
                </button>
                <button 
                  onClick={() => {
                    if (editingId) {
                      handleUpdateDate(editingId, editDate);
                    } else if (pendingAudit) {
                      handleAction(pendingAudit.customerId, pendingAudit.month, pendingAudit.type, editDate);
                      setPendingAudit(null);
                      setEditDate("");
                    }
                  }} 
                  className="flex-1 py-4 bg-teal-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-100 active:scale-95 transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* History Modal */}
        <AnimatePresence>
          {showHistoryId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowHistoryId(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border-4 border-teal-500/10"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-pastel-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-teal-500 rounded-2xl"><History className="w-5 h-5" /></div>
                    <h3 className="font-black text-slate-800">Lịch sử: {customers.find(c => c.id === showHistoryId)?.name}</h3>
                  </div>
                  <button onClick={() => setShowHistoryId(null)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-3">
                  {[...skinAuditLogs].filter(e => e.customerId === showHistoryId).map(log => (
                    <div key={log.id} className="p-4 bg-pastel-bg/50 rounded-2xl border border-pastel-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                          log.action === 'create' ? "bg-emerald-500 text-white" : 
                          log.action === 'update' ? "bg-indigo-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {log.action === 'create' ? 'Tạo' : log.action === 'update' ? 'Sửa' : 'Xóa'}
                        </span>
                        <span className="text-[10px] font-bold text-pastel-subtext">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="text-sm font-black text-slate-700">
                        <span className={cn(log.type === 'Khám' ? "text-teal-600" : "text-amber-600")}>{log.type}</span> 
                        {log.action !== 'delete' && <span> - Ngày: <span className="text-rose-500">{log.date}</span></span>}
                        {log.action === 'delete' && <span> đã bị xóa (Ngày cũ: {log.date})</span>}
                      </div>
                      <div className="text-[10px] font-bold text-pastel-subtext mt-1 italic">Người thực hiện: {log.user}</div>
                    </div>
                  ))}
                  {skinAuditLogs.filter(e => e.customerId === showHistoryId).length === 0 && (
                    <div className="text-center py-10 text-pastel-subtext italic text-sm">Chưa có lịch sử</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
}
