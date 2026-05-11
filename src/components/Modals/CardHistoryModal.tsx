import React from "react";
import { X, History, ChevronLeft } from "lucide-react";
import { KanbanCard } from "../../types";
import { motion } from "motion/react";

interface CardHistoryModalProps {
  card: KanbanCard;
  onClose: () => void;
}

export default function CardHistoryModal({ card, onClose }: CardHistoryModalProps) {
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
        <h3 className="font-black text-lg text-rose-500 uppercase tracking-tight">Lịch sử thẻ</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50">
        <div className="bg-white p-6 rounded-[40px] border border-pastel-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <History className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-800 text-base">{card.name}</h4>
          </div>

          <div className="space-y-3">
            {card.logs.length > 0 ? card.logs.map((log, i) => (
              <div key={i} className="p-4 bg-pastel-bg rounded-2xl border border-pastel-border/50 flex flex-col gap-1">
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">{log}</p>
              </div>
            )) : (
              <div className="text-center py-20 italic text-pastel-subtext text-[11px] font-black uppercase tracking-widest">
                Chưa có lịch sử hoạt động
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-pastel-border shrink-0">
        <button onClick={onClose} className="w-full py-4.5 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-100 active:scale-95 transition-transform">
          Đóng lịch sử
        </button>
      </div>
    </motion.div>
  );
}
