import React, { useState } from "react";
import { X, Notebook } from "lucide-react";
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
            <Notebook className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-pastel-text text-lg">Sửa ghi chú</h3>
        </div>

        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-pastel-bg border border-pastel-border rounded-2xl p-4 text-[14px] h-40 mb-5 font-medium outline-none focus:border-rose-200 no-scrollbar" 
          placeholder="Nhập nội dung ghi chú..."
        />

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 font-bold text-pastel-subtext bg-pastel-bg rounded-2xl active:bg-pastel-border"
          >
            Hủy
          </button>
          <button 
            onClick={() => onSave(note)}
            className="flex-1 py-3.5 font-black text-white bg-rose-400 rounded-2xl shadow-lg active:scale-95"
          >
            Lưu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
