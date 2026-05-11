import React, { useState } from "react";
import { User, Shield, Users, Pencil, Trash2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserAccount } from "../../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface AccountManagementModalProps {
  accounts: UserAccount[];
  onUpdateAccounts: (accounts: UserAccount[]) => void;
  onClose: () => void;
}

export default function AccountManagementModal({ accounts, onUpdateAccounts, onClose }: AccountManagementModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"Admin" | "Nhân viên">("Nhân viên");
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);

  const handleCreateOrUpdate = () => {
    if (!username.trim()) return;
    
    if (editingId) {
      onUpdateAccounts(accounts.map(a => a.id === editingId ? { ...a, username, role } : a));
      setEditingId(null);
    } else {
      const newAccount: UserAccount = {
        id: `acc-${Date.now()}`,
        username,
        role
      };
      onUpdateAccounts([newAccount, ...accounts]);
    }
    setUsername("");
    setRole("Nhân viên");
  };

  const handleEdit = (acc: UserAccount) => {
    setEditingId(acc.id);
    setUsername(acc.username);
    setRole(acc.role);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Xóa thành viên này?",
      action: () => {
        onUpdateAccounts(accounts.filter(a => a.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-2xl h-[85vh] sm:h-[600px] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-pastel-border bg-pastel-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Quản lý Tài khoản</h2>
              <p className="text-sm font-bold text-pastel-subtext mt-1">Phân quyền thành viên</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pastel-subtext hover:bg-pastel-bg hover:text-slate-700 transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
          {/* Form */}
          <div className="bg-pastel-bg p-4 rounded-3xl border border-pastel-border flex gap-3">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên truy cập..."
              className="flex-1 bg-white border border-pastel-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300"
            />
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-white border border-pastel-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300"
            >
              <option value="Nhân viên">Nhân viên</option>
              <option value="Admin">Admin</option>
            </select>
            <button 
              onClick={handleCreateOrUpdate}
              className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
            >
              {editingId ? "Sửa" : "Thêm"}
            </button>
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setUsername(""); setRole("Nhân viên"); }}
                className="bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                Hủy
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 border border-pastel-border bg-white rounded-3xl overflow-hidden flex flex-col">
            <div className="flex px-4 py-3 bg-pastel-bg border-b border-pastel-border text-xs font-black text-pastel-subtext uppercase">
              <div className="w-12 text-center">STT</div>
              <div className="flex-1">Thành viên</div>
              <div className="w-32">Chức năng</div>
              <div className="w-24 text-right">Thao tác</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="flex items-center px-2 py-3 hover:bg-pastel-bg rounded-2xl transition-colors">
                  <div className="w-12 text-center text-sm font-bold text-pastel-subtext">
                    {idx + 1}
                  </div>
                  <div className="flex-1 font-bold text-sm text-slate-700">
                    {acc.username}
                  </div>
                  <div className="w-32">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      acc.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {acc.role === 'Admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {acc.role}
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <button 
                      onClick={() => handleEdit(acc)}
                      className="p-2 text-indigo-500 bg-indigo-50 rounded-lg active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="h-full flex items-center justify-center text-pastel-subtext italic text-sm">
                  Chưa có thành viên nào
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {confirmConfig && (
        <ConfirmDialog 
          message={confirmConfig.message}
          onConfirm={confirmConfig.action}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
