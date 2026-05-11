import React, { useState } from "react";
import { X, Notebook, ChevronLeft, Save } from "lucide-react";
import { KanbanCard } from "../../types";
import { motion } from "motion/react";

interface NoteEditModalProps {
  card: KanbanCard;
  onClose: () => void;
  onSave: (note: string) => void;
}

export default function NoteEditModal({ card, onClose, onSave }: NoteEditModalProps) {
  const [note, setNote] = useState(card.note);

  return (
    <motion.div 
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-pastel-bg z-[1000] flex flex-col md:max-w-[430px] md:mx-auto md:border-x md:border-slate-200"
    >
      <div className="bg-white px-4 h-16 flex items-center gap-3 border-b border-pastel-border shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors active:scale-95">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
          <span className="font-black text-slate-600 text-sm">Quay lại</span>
        </button>
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <h3 className="font-black text-lg text-rose-500 uppercase tracking-tight">Sửa Ghi Chú</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50">
        <div className="bg-white p-6 rounded-[40px] border border-pastel-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <Notebook className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-800 text-base">{card.name}</h4>
          </div>

          <textarea 
            autoFocus
            value={note} onChange={e => setNote(e.target.value)}
            className="w-full bg-pastel-bg border-2 border-transparent rounded-3xl p-5 text-sm font-bold h-64 outline-none focus:border-rose-300 transition-all shadow-inner resize-none box-border"
            placeholder="Nhập nội dung ghi chú..."
          />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-pastel-border shrink-0">
        <button onClick={() => onSave(note)} className="w-full bg-rose-500 text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-100 active:scale-95 transition-transform flex items-center justify-center gap-3">
          <Save className="w-5 h-5" />
          Lưu ghi chú
        </button>
      </div>
    </motion.div>
  );
}
