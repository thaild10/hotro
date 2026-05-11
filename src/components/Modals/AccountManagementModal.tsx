import React, { useState } from "react";
import { User, Shield, Users, Pencil, Trash2, Plus, X } from "lucide-react";
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
  deviceView?: 'desktop' | 'mobile';
}

export default function AccountManagementModal({ accounts, onUpdateAccounts, onClose, deviceView = 'desktop' }: AccountManagementModalProps) {
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

  const handleEdit = (acc: UserAccount) => {
    setEditingId(acc.id);
    setUsername(acc.username);
    setRole(acc.role);
    setPassword(""); // Not updating password here for simplicity
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      message: "Xóa thành viên này khỏi danh sách? (Sẽ không xoá khỏi Firebase Auth)",
      action: () => {
        onUpdateAccounts(accounts.filter(a => a.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[2000] bg-white flex flex-col overflow-hidden",
        deviceView === 'mobile' ? "max-w-[430px] mx-auto shadow-2xl border-x border-slate-200" : "w-full"
      )}
    >
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-pastel-border shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors shrink-0"
          >
            ← Trang chủ
          </button>
          <div className="h-8 w-[1px] bg-pastel-border/50" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Tài khoản</h2>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Phân quyền thành viên</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar">
        {/* Form */}
        <div className="bg-indigo-50/30 p-6 rounded-[32px] border border-indigo-100 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">Email đăng nhập</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-400 shadow-sm transition-all"
              />
            </div>
            {!editingId && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">Mật khẩu</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 ký tự"
                  className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-400 shadow-sm transition-all"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center">
            <div className="w-full sm:w-auto space-y-1.5">
              <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">Vị trí công việc</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full sm:w-48 bg-white border border-indigo-100 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-400 shadow-sm transition-all appearance-none"
              >
                <option value="Nhân viên">Nhân viên</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {editingId && (
                <button 
                  onClick={() => { setEditingId(null); setUsername(""); setPassword(""); setRole("Nhân viên"); }}
                  className="bg-slate-100 text-slate-500 px-6 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
                >
                  Hủy
                </button>
              )}
              <button 
                onClick={handleCreateOrUpdate}
                disabled={loading}
                className="flex-1 sm:flex-none bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Đang xử lý..." : (editingId ? "Cập nhật" : "Tạo Tài khoản")}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 border border-pastel-border bg-white rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          <div className="flex px-6 py-4 bg-pastel-bg/50 border-b border-pastel-border text-[10px] font-black text-pastel-subtext uppercase tracking-widest">
            <div className="w-12 text-center">STT</div>
            <div className="flex-1">Thành viên</div>
            <div className="w-32">Vai trò</div>
            <div className="w-24 text-right">Thao tác</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {accounts.map((acc, idx) => (
              <div key={acc.id} className="flex items-center px-4 py-4 hover:bg-pastel-bg/30 border-b border-pastel-border/30 last:border-0 transition-colors">
                <div className="w-12 text-center text-xs font-black text-pastel-subtext">
                  {idx + 1}
                </div>
                <div className="flex-1 font-black text-sm text-slate-700">
                  {acc.username}
                </div>
                <div className="w-32">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight",
                    acc.role === 'Admin' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  )}>
                    {acc.role === 'Admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {acc.role}
                  </span>
                </div>
                <div className="w-24 flex items-center justify-end gap-1.5">
                  <button 
                    onClick={() => handleEdit(acc)}
                    className="p-2.5 text-indigo-500 bg-white border border-indigo-100 rounded-xl shadow-sm hover:bg-indigo-50 active:scale-90 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(acc.id)}
                    className="p-2.5 text-red-500 bg-white border border-red-100 rounded-xl shadow-sm hover:bg-red-50 active:scale-90 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center text-pastel-subtext italic text-sm gap-2">
                <Users className="w-8 h-8 opacity-20" />
                <span>Chưa có thành viên nào</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmConfig && (
        <ConfirmDialog 
          message={confirmConfig.message}
          onConfirm={confirmConfig.action}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </motion.div>
  );
}
