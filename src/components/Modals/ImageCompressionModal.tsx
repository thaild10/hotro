import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Check, Sliders, Upload, Save, Maximize, Search, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageCompressionSettings } from "../../types";
import { compressImage } from "../../lib/imageUtils";
import { cn } from "../../lib/utils";

interface ImageCompressionModalProps {
  settings: ImageCompressionSettings;
  onUpdateSettings: (settings: ImageCompressionSettings) => void;
  onClose: () => void;
}

export default function ImageCompressionModal({ settings, onUpdateSettings, onClose }: ImageCompressionModalProps) {
  const [localSettings, setLocalSettings] = useState<ImageCompressionSettings>(settings);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [compressedResult, setCompressedResult] = useState<{ url: string, size: number, originalSize: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTestFile(file);
      await runCompressionTest(file);
    }
  };

  const runCompressionTest = async (file: File) => {
    setIsCompressing(true);
    try {
      const blob = await compressImage(file, localSettings);
      const url = URL.createObjectURL(blob);
      setCompressedResult({
        url,
        size: blob.size,
        originalSize: file.size
      });
    } catch (error) {
      console.error("Compression check fail:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div 
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 bg-pastel-bg z-[1000] flex flex-col md:max-w-[430px] md:mx-auto md:border-x md:border-slate-200"
    >
      {/* Page Header */}
      <div className="bg-white px-4 h-16 flex items-center gap-3 border-b border-pastel-border shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors active:scale-95">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
          <span className="font-black text-slate-600 text-sm">Quay lại</span>
        </button>
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <h3 className="font-black text-lg text-indigo-500 uppercase tracking-tight">Nén ảnh</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-slate-50">
        {/* Settings Area */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-pastel-border shadow-sm space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Cạnh dài nhất (px)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={localSettings.maxWidth}
                  onChange={e => setLocalSettings(prev => ({ ...prev, maxWidth: Number(e.target.value) }))}
                  className="w-full pl-6 pr-14 py-4 bg-pastel-bg rounded-2xl border-2 border-transparent focus:border-indigo-400 outline-none font-black text-2xl text-indigo-600 transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-300">px</span>
              </div>
              <p className="text-[10px] text-slate-400 italic font-bold leading-relaxed ml-1">Kích thước tối đa của ảnh sau khi tải lên.</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest border-t border-slate-50 pt-4 block">Chất lượng ({localSettings.quality}%)</label>
              <div className="px-2">
                <input 
                  type="range" min="1" max="100"
                  value={localSettings.quality}
                  onChange={e => setLocalSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                  className="w-full accent-indigo-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-black text-slate-400 mt-3 uppercase tracking-tighter">
                  <span>Dung lượng thấp</span>
                  <span>Chất lượng cao</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Area */}
          <div className="bg-indigo-50/50 rounded-[40px] p-6 border-2 border-dashed border-indigo-200 flex flex-col items-center gap-6">
            <div className="text-center">
              <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Khu vực thử nghiệm</h4>
              <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">Kiểm tra ngay kết quả nén</p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              {!compressedResult ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white w-full py-12 rounded-[32px] border-2 border-indigo-200 border-dashed hover:border-indigo-400 transition-all flex flex-col items-center gap-4 active:scale-95 group shadow-sm shadow-indigo-50"
                >
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Upload className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-black text-indigo-600 block">Chọn ảnh thử nghiệm</span>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase mt-1">Hỗ trợ JPG, PNG, WEBP</span>
                  </div>
                </button>
              ) : (
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="relative group p-2 bg-white rounded-[40px] shadow-xl border border-white" onClick={() => setIsZoomed(true)}>
                    <div className="w-56 h-56 rounded-[35px] overflow-hidden relative shadow-inner bg-slate-50">
                      <img src={compressedResult.url} alt="Test" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 bg-white px-8 py-4 rounded-3xl border border-indigo-100 shadow-sm">
                    <div className="text-center">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gốc</div>
                      <div className="text-sm font-black text-slate-600">{formatSize(compressedResult.originalSize)}</div>
                    </div>
                    <div className="w-px h-8 bg-indigo-100"></div>
                    <div className="text-center">
                      <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Sau nén</div>
                      <div className="text-sm font-black text-indigo-600">{formatSize(compressedResult.size)}</div>
                      <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 rounded-full mt-1">
                        -{Math.round((1 - compressedResult.size / compressedResult.originalSize) * 100)}%
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-black text-indigo-500 px-6 py-2 bg-white rounded-full shadow-sm border border-indigo-50 uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    Thử lại với ảnh khác
                  </button>
                </div>
              )}
              
              <input type="file" ref={fileInputRef} onChange={handleTestUpload} className="hidden" accept="image/*" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-pastel-border shrink-0">
        <button 
          onClick={handleSave}
          className="w-full bg-indigo-500 py-4.5 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          <Save className="w-5 h-5" />
          Lưu cấu hình
        </button>
      </div>

      <AnimatePresence>
        {isZoomed && compressedResult && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <img src={compressedResult.url} alt="Zoom" className="max-w-full max-h-full object-contain" />
            <button className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white">
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
