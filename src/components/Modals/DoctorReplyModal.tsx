import React, { useState } from "react";
import { X, Stethoscope } from "lucide-react";
import { KanbanCard } from "../../types";
import { motion } from "motion/react";

interface DoctorReplyModalProps {
  card: KanbanCard;
  onClose: () => void;
  onSave: (reply: string) => void;
}

export default function DoctorReplyModal({ card, onClose, onSave }: DoctorReplyModalProps) {
  const [reply, setReply] = useState(card.doctorText || "");

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Stethoscope className="w-6 h-6 fill-current" />
          </div>
          <h3 className="font-bold text-pastel-text text-lg">Bác sĩ phản hồi</h3>
        </div>

        <textarea 
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="w-full bg-pastel-bg border border-pastel-border rounded-2xl p-4 text-[14px] h-32 mb-5 font-medium outline-none focus:border-indigo-200" 
          placeholder="Nhập phản hồi từ bác sĩ..."
        />

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 font-bold text-pastel-subtext bg-pastel-bg rounded-2xl active:bg-pastel-border"
          >
            Hủy
          </button>
          <button 
            onClick={() => onSave(reply)}
            className="flex-1 py-3.5 font-black text-white bg-indigo-500 rounded-2xl shadow-lg active:scale-95"
          >
            Lưu
          </button>
        </div>
      </motion.div>
    </div>
  );
}
