import React, { useState } from "react";
import { User, Shield, Users, Pencil, Trash2, Plus, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserAccount } from "../../types";
import { cn } from "../../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import firebaseConfig from "../../../firebase-applet-config.json";

interface AccountManagementModalProps {
  accounts: UserAccount[];
  onUpdateAccounts: (accounts: UserAccount[]) => void;
  onClose: () => void;
}

export default function AccountManagementModal({ accounts, onUpdateAccounts, onClose }: AccountManagementModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "Nhân viên">("Nhân viên");
  const [confirmConfig, setConfirmConfig] = useState<{message: string, action: () => void} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateOrUpdate = async () => {
    if (!username.trim()) return;
    
    if (editingId) {
      onUpdateAccounts(accounts.map(a => a.id === editingId ? { ...a, username, role } : a));
      setEditingId(null);
      setUsername("");
      setPassword("");
      setRole("Nhân viên");
    } else {
      if (!password.trim() || password.length < 6) {
        alert("Vui lòng nhập mật khẩu hợp lệ (ít nhất 6 ký tự) để tạo tài khoản!");
        return;
      }
      
      setLoading(true);
      try {
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        
        await createUserWithEmailAndPassword(secondaryAuth, username.trim(), password);
        
        const newAccount: UserAccount = {
          id: `acc-${Date.now()}`,
          username: username.trim(),
          role
        };
        onUpdateAccounts([newAccount, ...accounts]);
        setUsername("");
        setPassword("");
        setRole("Nhân viên");
      } catch (error: any) {
        console.error("Error creating user:", error);
        alert(`Lỗi tạo tài khoản: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

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
        <h3 className="font-black text-lg text-indigo-500 uppercase tracking-tight">Tài khoản</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-slate-50">
        {/* Form Section */}
        <div className="bg-white p-4 border-b border-pastel-border space-y-4 sticky top-0 z-10 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-pastel-subtext uppercase ml-1">Email / Tài khoản</label>
              <input 
                type="text" 
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Nhập email..."
                className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300 transition-all border-2 border-transparent"
              />
            </div>
            {!editingId && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-pastel-subtext uppercase ml-1">Mật khẩu</label>
                <input 
                  type="password" 
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300 transition-all border-2 border-transparent"
                />
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-pastel-subtext uppercase ml-1">Chức vụ</label>
                <select 
                  value={role} onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-pastel-bg rounded-xl px-4 py-3 text-sm font-bold outline-none border-2 border-transparent"
                >
                  <option value="Nhân viên">Nhân viên</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                {editingId && (
                  <button 
                    onClick={() => { setEditingId(null); setUsername(""); setRole("Nhân viên"); }}
                    className="p-3 text-slate-400 font-bold text-xs uppercase"
                  >
                    Huỷ
                  </button>
                )}
                <button 
                  onClick={handleCreateOrUpdate}
                  disabled={loading}
                  className="bg-indigo-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "..." : (editingId ? "Sửa" : "Thêm mới")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="p-4 space-y-3 pb-20">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Danh sách thành viên ({accounts.length})</h4>
          {accounts.map((acc, idx) => (
            <div key={acc.id} className="bg-white p-4 rounded-3xl border border-pastel-border shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-xs">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-700 text-sm line-clamp-1">{acc.username}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {acc.role === 'Admin' ? <Shield className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-slate-400" />}
                    <span className={cn("text-[10px] font-black uppercase", acc.role === 'Admin' ? "text-indigo-400" : "text-slate-400")}>{acc.role}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => { setEditingId(acc.id); setUsername(acc.username); setRole(acc.role); }}
                  className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl active:scale-90 transition-all"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setConfirmConfig({
                      message: "Xoá tài khoản này?",
                      action: () => { onUpdateAccounts(accounts.filter(a => a.id !== acc.id)); setConfirmConfig(null); }
                    });
                  }}
                  className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl active:scale-90 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-20 text-slate-400 font-bold italic text-sm">Chưa có tài khoản nào</div>
          )}
        </div>
      </div>

      {confirmConfig && (
        <ConfirmDialog message={confirmConfig.message} onConfirm={confirmConfig.action} onCancel={() => setConfirmConfig(null)} />
      )}
    </motion.div>
  );
}
