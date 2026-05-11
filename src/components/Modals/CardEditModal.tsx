import React, { useState } from "react";
import { X, NotebookPen, Trash2 } from "lucide-react";
import { KanbanCard } from "../../types";
import { motion } from "motion/react";

interface CardEditModalProps {
  card: KanbanCard;
  onClose: () => void;
  onSave: (updates: Partial<KanbanCard>) => void;
  onDelete: () => void;
}

export default function CardEditModal({ card, onClose, onSave, onDelete }: CardEditModalProps) {
  const [name, setName] = useState(card.name === "MỚI" ? "" : card.name);
  const [doDate, setDoDate] = useState(card.doDate);
  const [note, setNote] = useState(card.note);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (doDate && !/^(\d{1,2})\.(\d{1,2})$/.test(doDate)) {
      setError("Ngày dò sai định dạng. Ví dụ: 20.10");
      return;
    }
    onSave({ name, doDate, note });
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
            <NotebookPen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-pastel-text text-lg">Chỉnh sửa thẻ</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1">Tên khách hàng</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-[14px] font-bold uppercase outline-none focus:border-rose-200"
              placeholder="Họ tên khách"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1">Ngày dò</label>
            <input 
              type="text" 
              value={doDate}
              onChange={(e) => {
                setDoDate(e.target.value);
                setError(null);
              }}
              className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-[14px] font-medium outline-none focus:border-rose-200"
              placeholder="Ví dụ: 20.10"
            />
            {error && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{error}</p>}
          </div>
          <div>
            <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1">Ghi chú khách</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-[14px] font-medium h-24 outline-none focus:border-rose-200"
              placeholder="Nhập nội dung"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 font-bold text-pastel-subtext bg-pastel-bg rounded-xl active:scale-95 transition-all"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 font-black text-white bg-rose-400 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Cập nhật
            </button>
          </div>
          <button 
            onClick={() => {
              if (confirm("Xóa thẻ này?")) onDelete();
            }}
            className="w-full py-3 font-bold text-rose-500 bg-rose-50 rounded-xl flex items-center justify-center gap-2 active:bg-rose-100 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Xóa thẻ
          </button>
        </div>
      </motion.div>
    </div>
  );
}
