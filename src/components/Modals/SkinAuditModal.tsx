import React, { useState, useMemo } from "react";
import { X, Search, Calendar, History, ArrowDownAZ, ArrowUpZA, Pencil, Trash2, Save, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer, SkinAuditEntry } from "../../types";
import { cn, getTodayFormatted, getTimeFormatted } from "../../lib/utils";

interface SkinAuditModalProps {
  customers: Customer[];
  skinAudits: SkinAuditEntry[];
  username: string;
  onUpdateAudits: (audits: SkinAuditEntry[]) => void;
  onClose: () => void;
}

export default function SkinAuditModal({ customers, skinAudits, username, onUpdateAudits, onClose }: SkinAuditModalProps) {
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
  };

  const handleDelete = (id: string) => {
    onUpdateAudits(skinAudits.filter(e => e.id !== id));
  };

  const handleUpdateDate = (id: string, newDate: string) => {
    onUpdateAudits(skinAudits.map(e => e.id === id ? { ...e, date: newDate } : e));
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-pastel-bg w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border-4 border-white"
      >
        {/* Header */}
        <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-pastel-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-100">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Kiểm tra da</h2>
              <p className="text-xs font-bold text-pastel-subtext uppercase tracking-wider">Theo dõi lịch khám khách hàng</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-rose-50 rounded-2xl transition-colors text-slate-400 hover:text-rose-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/50 px-8 py-4 flex flex-wrap items-center gap-4 border-b border-pastel-border shrink-0">
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
                className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition-all", sortType === 'last-audit' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
              >
                Gần nhất
              </button>
              <button 
                onClick={() => setSortType('a-z')}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition-all", sortType === 'a-z' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setSortType('z-a')}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition-all", sortType === 'z-a' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
              >
                <ArrowUpZA className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setSortType('not-audited-this-month')}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition-all", sortType === 'not-audited-this-month' ? "bg-teal-500 text-white" : "text-pastel-subtext hover:bg-pastel-bg")}
              >
                Chưa khám
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <div className="bg-white rounded-[32px] border border-pastel-border flex-1 flex flex-col overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="flex items-center px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black uppercase tracking-widest text-pastel-subtext">
              <div className="w-12 text-center">STT</div>
              <div className="flex-1 px-4">Danh sách khách hàng</div>
              {months.map(m => (
                <div key={m.value} className="w-32 text-center border-l border-pastel-border/50">{m.label}</div>
              ))}
              <div className="w-24 text-center border-l border-pastel-border/50">Thao tác</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {sortedCustomers.map((customer, idx) => {
                return (
                  <div key={customer.id} className="flex items-center px-6 py-4 border-b border-pastel-border/30 hover:bg-pastel-bg/20 transition-colors">
                    <div className="w-12 text-center text-sm font-black text-pastel-subtext">{idx + 1}</div>
                    <div className="flex-1 px-4">
                      <div className="font-black text-slate-700">{customer.name}</div>
                    </div>

                    {months.map(month => {
                      const examEntry = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Khám');
                      const checkEntry = skinAudits.find(e => e.customerId === customer.id && e.month === month.value && e.type === 'Kiểm tra');

                      return (
                        <div key={month.value} className="w-32 flex flex-col items-center justify-center gap-2 border-l border-pastel-border/10">
                          {examEntry ? (
                            <div className="flex flex-col items-center gap-1 group">
                              <span className="text-[11px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                                {examEntry.date}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <button onClick={() => { setEditingId(examEntry.id); setEditDate(examEntry.date); }} className="p-1 bg-white border border-teal-200 rounded-md text-teal-500 shadow-sm hover:bg-teal-50"><Pencil className="w-2.5 h-2.5" /></button>
                                <button onClick={() => handleDelete(examEntry.id)} className="p-1 bg-white border border-rose-200 rounded-md text-rose-500 shadow-sm hover:bg-rose-50"><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setPendingAudit({ customerId: customer.id, month: month.value, type: 'Khám' });
                                setEditDate(getTodayFormatted().slice(0, 5));
                              }}
                              className="text-[10px] font-black text-pastel-subtext px-2 py-1 rounded-lg border border-pastel-border hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all active:scale-95"
                            >
                              Khám
                            </button>
                          )}

                          {!examEntry && (
                            checkEntry ? (
                              <div className="flex flex-col items-center gap-1 group">
                                <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                  {checkEntry.date}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                  <button onClick={() => { setEditingId(checkEntry.id); setEditDate(checkEntry.date); }} className="p-1 bg-white border border-amber-200 rounded-md text-amber-500 shadow-sm hover:bg-amber-50"><Pencil className="w-2.5 h-2.5" /></button>
                                  <button onClick={() => handleDelete(checkEntry.id)} className="p-1 bg-white border border-rose-200 rounded-md text-rose-500 shadow-sm hover:bg-rose-50"><Trash2 className="w-2.5 h-2.5" /></button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setPendingAudit({ customerId: customer.id, month: month.value, type: 'Kiểm tra' });
                                  setEditDate(getTodayFormatted().slice(0, 5));
                                }}
                                className="text-[10px] font-black text-pastel-subtext px-2 py-1 rounded-lg border border-dashed border-pastel-border hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all active:scale-95"
                              >
                                Kiểm tra
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}

                    <div className="w-24 border-l border-pastel-border/10 flex items-center justify-center gap-2">
                       <button 
                         onClick={() => setShowHistoryId(showHistoryId === customer.id ? null : customer.id)}
                         className="p-2.5 bg-pastel-bg text-pastel-subtext rounded-2xl hover:bg-teal-50 hover:text-teal-500 transition-colors active:scale-90"
                         title="Lịch sử"
                       >
                         <History className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  {[...skinAudits].filter(e => e.customerId === showHistoryId).reverse().map(e => (
                    <div key={e.id} className="p-4 bg-pastel-bg/50 rounded-2xl border border-pastel-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", e.type === 'Khám' ? "bg-teal-500 text-white" : "bg-amber-500 text-white")}>
                          {e.type}
                        </span>
                        <span className="text-[10px] font-bold text-pastel-subtext">{new Date(e.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="text-sm font-black text-slate-700">Ngày: <span className="text-teal-600">{e.date}</span></div>
                      <div className="text-[10px] font-bold text-pastel-subtext mt-1 italic">Người thực hiện: {e.createdBy}</div>
                    </div>
                  ))}
                  {skinAudits.filter(e => e.customerId === showHistoryId).length === 0 && (
                    <div className="text-center py-10 text-pastel-subtext italic text-sm">Chưa có lịch sử</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
