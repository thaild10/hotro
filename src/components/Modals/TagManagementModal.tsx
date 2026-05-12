import React, { useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { Tag, TAB_NAMES } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

// Helper for tag colors
const TAG_COLOR_PALETTE = [
  { bg: 'bg-rose-50',   text: 'text-rose-500',   border: 'border-rose-200'   },
  { bg: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-200' },
  { bg: 'bg-amber-50',  text: 'text-amber-500',  border: 'border-amber-200'  },
  { bg: 'bg-teal-50',   text: 'text-teal-500',   border: 'border-teal-200'   },
  { bg: 'bg-fuchsia-50',text: 'text-fuchsia-500',border: 'border-fuchsia-200'},
  { bg: 'bg-sky-50',    text: 'text-sky-500',    border: 'border-sky-200'    },
  { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' },
  { bg: 'bg-rose-50',   text: 'text-rose-500',   border: 'border-rose-200'   },
];

function getTagColors(tagText: string) {
  let hash = 0;
  for (let i = 0; i < tagText.length; i++) {
    hash = (hash * 31 + tagText.charCodeAt(i)) % TAG_COLOR_PALETTE.length;
  }
  return TAG_COLOR_PALETTE[hash];
}

interface TagManagementModalProps {
  tagsConfig: Record<number, Tag[]>;
  onClose: () => void;
  onUpdateConfig: (newConfig: Record<number, Tag[]>) => void;
  deviceView?: 'desktop' | 'mobile';
}

export default function TagManagementModal({ tagsConfig, onClose, onUpdateConfig, deviceView = 'desktop' }: TagManagementModalProps) {
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedTabsForNewTag, setSelectedTabsForNewTag] = useState<number[]>([]);

  const handleToggleTagInTab = (tabId: number, tagText: string) => {
    const currentTags = tagsConfig[tabId] || [];
    const exists = currentTags.find(t => t.text === tagText);
    
    let newTags;
    if (exists) {
      newTags = currentTags.filter(t => t.text !== tagText);
    } else {
      newTags = [...currentTags, { text: tagText }];
    }
    
    onUpdateConfig({ ...tagsConfig, [tabId]: newTags });
  };

  const handleDeleteTagGlobal = (tagText: string) => {
    if (!confirm(`Xoá tag "${tagText}" khỏi toàn bộ hệ thống?`)) return;
    
    const newConfig: Record<number, Tag[]> = {};
    Object.entries(tagsConfig).forEach(([id, tags]) => {
      newConfig[parseInt(id)] = tags.filter(t => t.text !== tagText);
    });
    onUpdateConfig(newConfig);
  };

  const handleSaveNewTag = () => {
    if (!newTagName.trim() || selectedTabsForNewTag.length === 0) return;
    
    const newConfig = { ...tagsConfig };
    selectedTabsForNewTag.forEach(tabId => {
      if (!newConfig[tabId]) newConfig[tabId] = [];
      if (!newConfig[tabId].find(t => t.text === newTagName)) {
        newConfig[tabId].push({ text: newTagName });
      }
    });
    
    onUpdateConfig(newConfig);
    setShowCreateTag(false);
    setNewTagName("");
  };

  const allAvailableTags = Array.from(new Set(Object.values(tagsConfig).flatMap(tags => tags.map(t => t.text))));

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
            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Quản lý Tag</h2>
              <p className="text-[9px] font-bold text-violet-600 uppercase tracking-wider">Cấu hình thẻ phân loại</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {Object.entries(TAB_NAMES).map(([id, name]) => {
          const tabId = parseInt(id);
          if (tabId === 0) return null;
          const tags = tagsConfig[tabId] || [];
          return (
            <div key={id} className="p-4 bg-pastel-bg rounded-3xl border border-pastel-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-violet-500 uppercase tracking-wider">{name}</span>
                <button 
                  onClick={() => {
                    setEditingTabId(tabId);
                    setSelectedTabsForNewTag([tabId]);
                  }} 
                  className="text-[10px] font-black text-violet-500 bg-white border border-violet-200 px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm"
                >
                  Sửa tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? tags.map(t => {
                  const colors = getTagColors(t.text);
                  return (
                    <span key={t.text} className={cn("px-3 py-1.5 rounded-full text-[10px] font-black border shadow-sm transition-all", colors.bg, colors.text, colors.border)}>
                      {t.text}
                    </span>
                  );
                }) : <span className="text-[10px] italic text-pastel-subtext ml-1">Chưa có tag</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-white border-t border-pastel-border shrink-0">
        <button 
          onClick={() => {
            setShowCreateTag(true);
            setSelectedTabsForNewTag([]);
          }} 
          className="w-full bg-violet-500 py-4 rounded-2xl text-white font-black text-sm shadow-xl shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Tạo tag mới & Gán khung
        </button>
      </div>


      {/* Sub Modals */}
      <AnimatePresence>
        {editingTabId !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-violet-500">Sửa tag khung</h3>
                  <p className="text-[11px] font-black text-pastel-subtext mt-0.5">{TAB_NAMES[editingTabId]}</p>
                </div>
                <button onClick={() => setEditingTabId(null)} className="p-2 bg-pastel-bg rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="flex flex-wrap gap-2 py-2">
                  {allAvailableTags.map(tagText => {
                    const isActive = (tagsConfig[editingTabId!] || []).some(t => t.text === tagText);
                    const colors = getTagColors(tagText);
                    return (
                      <button 
                        key={tagText}
                        onClick={() => handleToggleTagInTab(editingTabId!, tagText)}
                        onContextMenu={(e) => { e.preventDefault(); handleDeleteTagGlobal(tagText); }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black transition-all border",
                          isActive ? cn(colors.bg, colors.text, colors.border, "border-2") : "bg-white text-pastel-subtext border-pastel-border opacity-50"
                        )}
                      >
                        {tagText}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-pastel-subtext italic mt-2">Bấm để bật/tắt · Giữ chuột phải (Mobile: ấn giữ) để xoá vĩnh viễn</p>
              </div>
              <button 
                onClick={() => setShowCreateTag(true)} 
                className="mt-4 w-full bg-violet-400 py-3.5 rounded-2xl text-white font-black text-[14px] shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tạo tag mới
              </button>
            </motion.div>
          </motion.div>
        )}

        {showCreateTag && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-violet-500">Tạo tag mới</h3>
                <button onClick={() => setShowCreateTag(false)} className="p-2 bg-pastel-bg rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase ml-1">Tên tag</label>
                  <input 
                    type="text" 
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-[13px] font-bold outline-none focus:border-violet-300 mt-1" 
                    placeholder="Ví dụ: Đang làm, Chờ rep..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-pastel-subtext uppercase ml-1">Áp dụng cho khung</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(TAB_NAMES).map(([id, name]) => {
                      const tabId = parseInt(id);
                      if (tabId === 0) return null;
                      const isChecked = selectedTabsForNewTag.includes(tabId);
                      return (
                        <label 
                          key={id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all",
                            isChecked ? "border-violet-300 bg-violet-50" : "border-pastel-border bg-pastel-bg"
                          )}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) setSelectedTabsForNewTag(prev => prev.filter(t => t !== tabId));
                              else setSelectedTabsForNewTag(prev => [...prev, tabId]);
                            }}
                            className="w-3.5 h-3.5 accent-violet-400"
                          />
                          <span className="text-[11px] font-bold text-pastel-text">{name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreateTag(false)} className="flex-1 py-3 font-bold text-pastel-subtext bg-pastel-bg rounded-xl">Hủy</button>
                <button onClick={handleSaveNewTag} className="flex-1 py-3 font-black text-white bg-violet-400 rounded-xl shadow-lg">Tạo tag</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
