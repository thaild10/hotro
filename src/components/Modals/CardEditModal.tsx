import React, { useState, useMemo } from "react";
import { X, NotebookPen, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { KanbanCard, Customer, Tag, ImageCompressionSettings } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { uploadToFirebase } from "../../lib/imageUtils";

interface CardEditModalProps {
  card: KanbanCard;
  customers?: Customer[];
  tagsConfig?: Record<number, Tag[]>;
  compressionSettings?: ImageCompressionSettings;
  onClose: () => void;
  onSave: (updates: Partial<KanbanCard>) => void;
  onDelete: () => void;
}

export default function CardEditModal({ 
  card, 
  customers = [], 
  tagsConfig = {},
  compressionSettings,
  onClose, 
  onSave, 
  onDelete 
}: CardEditModalProps) {
  const [name, setName] = useState(card.name === "MỚI" ? "" : card.name);
  const [doDate, setDoDate] = useState(card.doDate);
  const [note, setNote] = useState(card.note);
  const [images, setImages] = useState<string[]>(card.images || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(card.tags || []);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const availableTags = tagsConfig[card.tabId] || [];

  const suggestions = useMemo(() => {
    if (name.length < 3) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(name.toLowerCase())
    ).slice(0, 5);
  }, [name, customers]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!doDate.trim()) {
      setError("Vui lòng nhập ngày dò");
      return;
    }
    if (doDate && !/^(\d{1,2})\.(\d{1,2})$/.test(doDate)) {
      setError("Ngày dò sai định dạng. Ví dụ: 20.10");
      return;
    }
    onSave({ 
      name: name.trim(), 
      doDate, 
      note, 
      images, 
      tags: selectedTags 
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const file = files[0];
        const url = await uploadToFirebase(file, 'kanban', compressionSettings);
        setImages(prev => [...prev, url]);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Upload ảnh thất bại!");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tagText: string) => {
    setSelectedTags(prev => 
      prev.includes(tagText) 
        ? prev.filter(t => t !== tagText)
        : [...prev, tagText]
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
            <NotebookPen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-pastel-text text-lg">Chỉnh sửa thẻ</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1">
              Tên khách hàng <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
                setError(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-pastel-bg border border-pastel-border rounded-xl p-3 text-[14px] font-bold outline-none focus:border-rose-200"
              placeholder="Họ tên khách"
            />
            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-pastel-border rounded-xl shadow-xl overflow-hidden"
                >
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setName(s.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-pastel-bg transition-colors flex items-center gap-3 border-b border-pastel-border last:border-0"
                    >
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} className="w-6 h-6 rounded-md object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-pastel-bg flex items-center justify-center"><NotebookPen className="w-3 h-3 text-pastel-subtext" /></div>
                      )}
                      <span className="">{s.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1">
              Ngày dò <span className="text-red-500">*</span>
            </label>
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

          {availableTags.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1 mb-1 block">Gắn tag</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag, idx) => {
                  const isSelected = selectedTags.includes(tag.text);
                  return (
                    <button
                      key={`${tag.text}-${idx}`}
                      onClick={() => toggleTag(tag.text)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                        isSelected 
                          ? "bg-rose-500 text-white border-rose-500 shadow-sm" 
                          : "bg-white text-pastel-subtext border-pastel-border hover:border-rose-300"
                      )}
                    >
                      {tag.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-pastel-subtext uppercase ml-1 block mb-2">Ảnh đính kèm</label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative w-20 h-20 group">
                  <img src={url} alt="card" className="w-full h-full object-cover rounded-xl border border-pastel-border" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "w-20 h-20 rounded-xl border-2 border-dashed border-pastel-border flex flex-col items-center justify-center text-pastel-subtext hover:border-rose-300 transition-all",
                   isUploading && "opacity-50 cursor-wait"
                )}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Thêm</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-[11px] text-red-500 font-bold mt-1 ml-1">{error}</p>}
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
              className="flex-1 py-3 font-black text-white bg-rose-400 rounded-xl shadow-lg shadow-rose-200/50 active:scale-95 transition-all"
            >
              {card.id === 'temp' ? "Tạo thẻ" : "Cập nhật"}
            </button>
          </div>
          {card.id !== 'temp' && (
            <button 
              onClick={onDelete}
              className="w-full py-3 font-bold text-red-500 bg-red-50 rounded-xl flex items-center justify-center gap-2 active:bg-red-100 transition-all border border-red-100"
            >
              <Trash2 className="w-4 h-4" /> Xóa thẻ
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
