import React, { useState } from "react";
import { X, Plus, Search, ChevronLeft } from "lucide-react";
import { Tag, TAB_NAMES } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

const TAG_COLOR_PALETTE = [
  { bg: 'bg-rose-50',   text: 'text-rose-500',   border: 'border-rose-200'   },
  { bg: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-200' },
  { bg: 'bg-amber-50',  text: 'text-amber-500',  border: 'border-amber-200'  },
  { bg: 'bg-teal-50',   text: 'text-teal-500',   border: 'border-teal-200'   },
  { bg: 'bg-fuchsia-50',text: 'text-fuchsia-500',border: 'border-fuchsia-200'},
  { bg: 'bg-sky-50',    text: 'text-sky-500',    border: 'border-sky-200'    },
  { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' },
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
}

export default function TagManagementModal({ tagsConfig, onClose, onUpdateConfig }: TagManagementModalProps) {
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedTabsForNewTag, setSelectedTabsForNewTag] = useState<number[]>([]);

  const handleToggleTagInTab = (tabId: number, tagText: string) => {
    const currentTags = tagsConfig[tabId] || [];
    const exists = currentTags.find(t => t.text === tagText);
    let newTags = exists ? currentTags.filter(t => t.text !== tagText) : [...currentTags, { text: tagText }];
    onUpdateConfig({ ...tagsConfig, [tabId]: newTags });
  };

  const handleDeleteTagGlobal = (tagText: string) => {
    if (!confirm(`Xoá tag "${tagText}" khỏi toàn bộ hệ thống?`)) return;
    const newConfig: Record<number, Tag[]> = {};
    Object.entries(tagsConfig).forEach(([id, tags]) => { newConfig[parseInt(id)] = tags.filter(t => t.text !== tagText); });
    onUpdateConfig(newConfig);
  };

  const handleSaveNewTag = () => {
    if (!newTagName.trim() || selectedTabsForNewTag.length === 0) return;
    const newConfig = { ...tagsConfig };
    selectedTabsForNewTag.forEach(tabId => {
      if (!newConfig[tabId]) newConfig[tabId] = [];
      if (!newConfig[tabId].find(t => t.text === newTagName)) newConfig[tabId].push({ text: newTagName });
    });
    onUpdateConfig(newConfig);
    setShowCreateTag(false);
    setNewTagName("");
  };

  const allAvailableTags = Array.from(new Set(Object.values(tagsConfig).flatMap(tags => tags.map(t => t.text))));

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
        <h3 className="font-black text-lg text-rose-500 uppercase tracking-tight">Thẻ Tag</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {Object.entries(TAB_NAMES).map(([id, name]) => {
          const tabId = parseInt(id);
          if (tabId === 0) return null;
          const tags = tagsConfig[tabId] || [];
          return (
            <div key={id} className="bg-white p-4 rounded-3xl border border-pastel-border shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">{name}</span>
                <button 
                  onClick={() => { setEditingTabId(tabId); setSelectedTabsForNewTag([tabId]); }} 
                  className="text-[10px] font-black text-violet-500 bg-violet-50 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                >
                  Sửa Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? tags.map(t => {
                  const colors = getTagColors(t.text);
                  return (
                    <span key={t.text} className={cn("px-3 py-1 rounded-full text-[11px] font-bold border", colors.bg, colors.text, colors.border)}>
                      {t.text}
                    </span>
                  );
                }) : <span className="text-[11px] italic text-pastel-subtext py-1">Chưa có tag nào</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t border-pastel-border shrink-0">
        <button 
          onClick={() => { setShowCreateTag(true); setSelectedTabsForNewTag([]); }} 
          className="w-full bg-rose-500 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-100 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Tạo tag mới
        </button>
      </div>

      <AnimatePresence>
        {editingTabId !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl flex flex-col max-h-[80vh] p-6 border-4 border-violet-500/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-black text-violet-500 uppercase text-xs">Sửa tag cho khung</h4>
                  <p className="font-bold text-slate-800 text-lg">{TAB_NAMES[editingTabId]}</p>
                </div>
                <button onClick={() => setEditingTabId(null)} className="p-2 bg-pastel-bg rounded-xl"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
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
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                          isActive ? cn(colors.bg, colors.text, colors.border, "border-2 opacity-100") : "bg-white text-slate-400 border-pastel-border opacity-50"
                        )}
                      >
                        {tagText}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-pastel-subtext text-center italic">Bấm để thêm/xoá khỏi khung · Click chuột phải để xoá vĩnh viễn hệ thống</p>
              </div>
              <button 
                onClick={() => setShowCreateTag(true)} 
                className="mt-6 w-full bg-violet-500 py-4 rounded-2xl text-white font-black text-xs uppercase shadow-lg shadow-violet-100 active:scale-95"
              >
                Tạo tag mới
              </button>
            </motion.div>
          </motion.div>
        )}

        {showCreateTag && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            onClick={() => setShowCreateTag(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-black text-xl text-rose-500 uppercase text-center mb-6">Tạo tag mới</h3>
              <div className="space-y-6">
                <input 
                  autoFocus
                  placeholder="Nhập tên tag..."
                  value={newTagName} onChange={e => setNewTagName(e.target.value)}
                  className="w-full bg-pastel-bg rounded-2xl p-4 text-center text-lg font-bold outline-none border-2 border-transparent focus:border-rose-400 transition-all"
                />
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-pastel-subtext ml-2">Áp dụng cho các khung:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TAB_NAMES).map(([id, name]) => {
                      const tabId = parseInt(id);
                      if (tabId === 0) return null;
                      const isChecked = selectedTabsForNewTag.includes(tabId);
                      return (
                        <div 
                          key={id}
                          onClick={() => isChecked ? setSelectedTabsForNewTag(p => p.filter(t => t !== tabId)) : setSelectedTabsForNewTag(p => [...p, tabId])}
                          className={cn("p-2.5 rounded-xl border-2 font-black text-[10px] text-center uppercase tracking-tight transition-all cursor-pointer", isChecked ? "bg-rose-50 border-rose-300 text-rose-500" : "bg-pastel-bg border-transparent text-pastel-subtext")}
                        >
                          {name}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreateTag(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95">Huỷ</button>
                  <button onClick={handleSaveNewTag} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 active:scale-95">Xác nhận</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
