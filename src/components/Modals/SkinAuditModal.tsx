import React, { useState, useMemo } from "react";
import { X, Search, Calendar, History, ArrowDownAZ, ArrowUpZA, Pencil, Trash2, Save, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer, SkinAuditEntry, SkinAuditLog } from "../../types";
import { cn, getTodayFormatted, getTimeFormatted } from "../../lib/utils";

interface SkinAuditModalProps {
  customers: Customer[];
  skinAudits: SkinAuditEntry[];
  skinAuditLogs: SkinAuditLog[];
  username: string;
  onUpdateAudits: (audits: SkinAuditEntry[]) => void;
  onUpdateLogs: (logs: SkinAuditLog[]) => void;
  onClose: () => void;
}

export default function SkinAuditModal({ 
  customers, 
  skinAudits, 
  skinAuditLogs,
  username, 
  onUpdateAudits, 
  onUpdateLogs,
  onClose 
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
        <h3 className="font-black text-lg text-teal-500 uppercase tracking-tight">Khám da</h3>
      </div>

      {/* Filters */}
      <div className="bg-white px-4 py-3 flex flex-col gap-3 border-b border-pastel-border shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pastel-subtext" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên khách hàng..."
            className="w-full pl-10 pr-4 py-3 bg-pastel-bg rounded-xl text-sm font-bold border border-transparent outline-none focus:border-teal-400 transition-colors"
          />
        </div>
        <div className="flex bg-pastel-bg rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSortType('last-audit')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] whitespace-nowrap font-black uppercase transition-all", sortType === 'last-audit' ? "bg-teal-500 text-white shadow-md shadow-teal-100" : "text-pastel-subtext hover:bg-white/50")}
          >
            Gần nhất
          </button>
          <button 
            onClick={() => setSortType('not-audited-this-month')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] whitespace-nowrap font-black uppercase transition-all ml-1", sortType === 'not-audited-this-month' ? "bg-teal-500 text-white shadow-md shadow-teal-100" : "text-pastel-subtext hover:bg-white/50")}
          >
            Chưa khám
          </button>
          <button 
            onClick={() => setSortType('a-z')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] whitespace-nowrap font-black uppercase transition-all ml-1", sortType === 'a-z' ? "bg-teal-500 text-white shadow-md shadow-teal-100" : "text-pastel-subtext hover:bg-white/50")}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Horizontal Table for Mobile-Friendly view */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
        <div className="p-4 space-y-4 pb-20">
          {sortedCustomers.map((customer, idx) => {
            return (
              <div key={customer.id} className="bg-white p-4 rounded-3xl border border-pastel-border shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-pastel-subtext w-5">{idx + 1}.</span>
                    <span className="font-bold text-slate-800">{customer.name}</span>
                  </div>
                  <button 
                    onClick={() => setShowHistoryId(showHistoryId === customer.id ? null : customer.id)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl active:scale-90 transition-transform"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {months.map(month => {
                    const examEntry = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Khám');
                    const checkEntry = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Kiểm tra');

                    return (
                      <div key={month.value} className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-pastel-subtext text-center uppercase tracking-tighter">{month.label}</div>
                        <div className="flex flex-col gap-1.5 min-h-[60px]">
                          {examEntry ? (
                            <div className="bg-teal-50 border border-teal-100 rounded-xl p-1.5 flex flex-col items-center gap-1 group">
                              <span className="text-[11px] font-black text-teal-600">{examEntry.date}</span>
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingId(examEntry.id); setEditDate(examEntry.date); }} className="p-1 hover:bg-white rounded text-teal-500"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => handleDelete(examEntry.id)} className="p-1 hover:bg-white rounded text-rose-500"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setPendingAudit({ customerId: customer.id, month: month.value, type: 'Khám' });
                                setEditDate(getTodayFormatted().slice(0, 5));
                              }}
                              className="w-full flex-1 border border-dashed border-teal-200 text-[10px] font-black text-teal-500 rounded-xl active:scale-95 transition-all py-2"
                            >
                              Khám
                            </button>
                          )}

                          {!examEntry && (
                            checkEntry ? (
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-1.5 flex flex-col items-center gap-1">
                                <span className="text-[11px] font-black text-amber-600">{checkEntry.date}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditingId(checkEntry.id); setEditDate(checkEntry.date); }} className="p-1 hover:bg-white rounded text-amber-500"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => handleDelete(checkEntry.id)} className="p-1 hover:bg-white rounded text-rose-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setPendingAudit({ customerId: customer.id, month: month.value, type: 'Kiểm tra' });
                                  setEditDate(getTodayFormatted().slice(0, 5));
                                }}
                                className="w-full flex-1 border border-dotted border-amber-200 text-[10px] font-bold text-amber-500/70 rounded-xl active:scale-95 transition-all py-1.5"
                              >
                                Test
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {sortedCustomers.length === 0 && (
            <div className="text-center py-20 text-slate-400 italic text-sm">Không tìm thấy kết quả</div>
          )}
        </div>
      </div>

      {/* Date Entry/Edit Modal */}
      {(editingId || pendingAudit) && (
        <div className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border-4 border-teal-500/20"
          >
            <h3 className="text-sm font-black text-slate-800 uppercase mb-4 text-center">
              {pendingAudit ? `Ngày ${pendingAudit.type}` : 'Sửa ngày'}
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
              <button onClick={() => { setEditingId(null); setPendingAudit(null); setEditDate(""); }} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase active:scale-95">Huỷ</button>
              <button 
                onClick={() => {
                  if (editingId) handleUpdateDate(editingId, editDate);
                  else if (pendingAudit) {
                    handleAction(pendingAudit.customerId, pendingAudit.month, pendingAudit.type, editDate);
                    setPendingAudit(null);
                    setEditDate("");
                  }
                }} 
                className="flex-1 py-3.5 bg-teal-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-teal-100 active:scale-95"
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowHistoryId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden"
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
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
