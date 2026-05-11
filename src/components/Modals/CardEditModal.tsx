import React, { useState, useMemo } from "react";
import { X, NotebookPen, Trash2, ChevronLeft, Save, User as UserIcon } from "lucide-react";
import { KanbanCard, Customer } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface CardEditModalProps {
  card: KanbanCard;
  customers?: Customer[];
  onClose: () => void;
  onSave: (updates: Partial<KanbanCard>) => void;
  onDelete: () => void;
}

export default function CardEditModal({ card, customers = [], onClose, onSave, onDelete }: CardEditModalProps) {
  const [name, setName] = useState(card.name === "MỚI" ? "" : card.name);
  const [doDate, setDoDate] = useState(card.doDate);
  const [note, setNote] = useState(card.note);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (name.length < 2) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(name.toLowerCase())
    ).slice(0, 8);
  }, [name, customers]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!doDate.trim()) {
      setError("Vui lòng nhập ngày dò");
      return;
    }
    if (doDate && !/^(\d{1,2})\.(\d{1,2})$/.test(doDate)) {
      setError("Ngày dò sai định dạng. Ví dụ: 20.10");
      return;
    }
    onSave({ name: name.trim(), doDate, note });
  };

  return (
    <motion.div 
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-pastel-bg z-[1000] flex flex-col md:max-w-[430px] md:mx-auto md:border-x md:border-slate-200"
    >
      {/* Page Header */}
      <div className="bg-white px-4 h-16 flex items-center gap-3 border-b border-pastel-border shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors active:scale-95">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
          <span className="font-black text-slate-600 text-sm">Quay lại</span>
        </button>
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <h3 className="font-black text-lg text-rose-500 uppercase tracking-tight">Thẻ Khám</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-slate-50 pb-24">
        <div className="bg-white p-6 rounded-[40px] border border-pastel-border shadow-sm space-y-6 relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <NotebookPen className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-none">Thông tin</h4>
              <p className="text-[10px] font-bold text-pastel-subtext uppercase tracking-widest mt-1">Cập nhật chi tiết lần khám</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="relative">
              <label className="text-[10px] font-black text-pastel-subtext uppercase ml-2 tracking-widest">Tên khách hàng</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                  setError(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-pastel-bg border-2 border-transparent rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-rose-300 transition-all shadow-inner"
                placeholder="Nhập tên..."
              />
              
              {/* Suggestions Overlay */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute z-50 left-0 right-0 top-[calc(100%+8px)] bg-white border border-pastel-border rounded-3xl shadow-2xl overflow-hidden p-1 max-h-[300px] overflow-y-auto no-scrollbar"
                  >
                    <div className="p-3 border-b border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Gợi ý khách hàng</span>
                      <button onClick={() => setShowSuggestions(false)} className="p-1"><X className="w-4 h-4 text-slate-300" /></button>
                    </div>
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setName(s.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full p-2 hover:bg-rose-50 rounded-2xl transition-colors flex items-center gap-3 active:scale-98"
                      >
                        <div className="w-10 h-10 rounded-xl bg-pastel-bg flex items-center justify-center overflow-hidden border border-pastel-border">
                          {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-slate-300" />}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-pastel-subtext uppercase ml-2 tracking-widest">Ngày khám / dò (dd.mm)</label>
              <input 
                type="text" 
                value={doDate}
                onChange={(e) => {
                  setDoDate(e.target.value);
                  setError(null);
                }}
                className="w-full bg-pastel-bg border-2 border-transparent rounded-2xl px-5 py-4 text-xl font-black text-rose-500 outline-none focus:border-rose-300 transition-all shadow-inner text-center"
                placeholder="20.10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-pastel-subtext uppercase ml-2 tracking-widest">Ghi chú (Note)</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-pastel-bg border-2 border-transparent rounded-3xl px-5 py-4 text-sm font-bold h-32 outline-none focus:border-rose-300 transition-all shadow-inner resize-none box-border"
                placeholder="Nhập nội dung ghi chú..."
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-black text-rose-500 text-center">
                {error}
              </motion.div>
            )}
          </div>
        </div>

        {card.id !== 'temp' && (
          <button 
            onClick={onDelete}
            className="w-full py-4 bg-white border border-rose-100 rounded-[24px] text-rose-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:bg-rose-50 transition-colors shadow-sm"
          >
            <Trash2 className="w-5 h-5" /> Xóa thẻ khám
          </button>
        )}
      </div>

      {/* Footer sticky buttons */}
      <div className="p-4 bg-white border-t border-pastel-border shrink-0 flex gap-4">
        <button 
          onClick={onClose}
          className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform"
        >
          Hủy
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {card.id === 'temp' ? "Tạo ngay" : "Lưu lại"}
        </button>
      </div>
    </motion.div>
  );
}
