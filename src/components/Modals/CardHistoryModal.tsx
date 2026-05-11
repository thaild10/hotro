import React from "react";
import { X, History } from "lucide-react";
import { KanbanCard } from "../../types";
import { motion } from "motion/react";

interface CardHistoryModalProps {
  card: KanbanCard;
  onClose: () => void;
}

export default function CardHistoryModal({ card, onClose }: CardHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between mb-4 border-b pb-3 border-pastel-border">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-rose-400" /> Lịch sử thẻ
            </h3>
            <p className="text-[11px] font-black text-rose-400 uppercase tracking-wide mt-0.5">
              {card.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-pastel-bg rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar py-2">
          {card.logs.length > 0 ? card.logs.map((log, i) => (
            <div key={i} className="p-3 bg-pastel-bg rounded-2xl border border-pastel-border/50 text-[11px] font-medium leading-relaxed">
              {log}
            </div>
          )) : (
            <div className="text-center italic text-pastel-subtext text-[11px] py-10">
              Chưa có lịch sử
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
