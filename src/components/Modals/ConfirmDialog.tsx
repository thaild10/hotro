import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận</h3>
          <p className="text-slate-500 mb-6">{message}</p>
          <div className="flex w-full gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 py-3.5 font-bold text-slate-500 bg-slate-100 rounded-xl active:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3.5 font-bold text-white bg-violet-500 rounded-xl shadow-lg shadow-violet-200 active:bg-violet-600 transition-colors"
            >
              Đồng ý
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
