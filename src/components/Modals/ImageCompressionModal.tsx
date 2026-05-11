import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Check, Sliders, Upload, Save, Maximize, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageCompressionSettings } from "../../types";
import { compressImage } from "../../lib/imageUtils";
import { cn } from "../../lib/utils";

interface ImageCompressionModalProps {
  settings: ImageCompressionSettings;
  onUpdateSettings: (settings: ImageCompressionSettings) => void;
  onClose: () => void;
  deviceView?: 'desktop' | 'mobile';
}

export default function ImageCompressionModal({ settings, onUpdateSettings, onClose, deviceView = 'desktop' }: ImageCompressionModalProps) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-white z-[2000] flex flex-col overflow-hidden",
        deviceView === 'mobile' ? "max-w-[430px] mx-auto shadow-2xl border-x border-slate-200" : "w-full"
      )}
    >
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-indigo-50 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors shrink-0"
          >
            ← Trang chủ
          </button>
          <div className="h-8 w-[1px] bg-slate-100" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Cấu hình nén ảnh</h2>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Tối ưu lưu trữ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Settings Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Chiều dài tối đa (px)</label>
            <div className="relative">
              <input 
                type="number"
                value={localSettings.maxWidth}
                onChange={e => setLocalSettings(prev => ({ ...prev, maxWidth: Number(e.target.value) }))}
                className="w-full pl-6 pr-12 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-700 transition-all"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">px</span>
            </div>
            <p className="text-[9px] text-slate-400 italic font-medium ml-1">Ảnh sẽ được co lại nếu chiều rộng/cao vượt mức này</p>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase text-slate-400 ml-1">Chất lượng ({localSettings.quality}%)</label>
            <div className="px-2 pt-4">
              <input 
                type="range"
                min="1"
                max="100"
                value={localSettings.quality}
                onChange={e => setLocalSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
                <span>Dung lượng thấp</span>
                <span>Chất lượng cao</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Area */}
        <div className="bg-indigo-50/30 rounded-[32px] p-6 border-2 border-dashed border-indigo-100 flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-wide">Khu vực thử nghiệm</h3>
            <p className="text-[10px] font-bold text-indigo-400 mt-1">Tải ảnh lên để xem trước kết quả nén</p>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            {!compressedResult ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white p-10 rounded-3xl border-2 border-indigo-200 border-dashed hover:border-indigo-400 transition-all flex flex-col items-center gap-3 active:scale-95 group w-full max-w-sm"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Upload className="w-6 h-6 text-indigo-500" />
                </div>
                <span className="text-sm font-black text-indigo-600">Chọn ảnh thử nghiệm</span>
              </button>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => setIsZoomed(true)}>
                  <div className="w-48 h-48 rounded-[32px] overflow-hidden border-4 border-white shadow-xl bg-white relative">
                    <img src={compressedResult.url} alt="Test" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Gốc</div>
                    <div className="text-xs font-black text-slate-600">{formatSize(compressedResult.originalSize)}</div>
                  </div>
                  <div className="w-6 h-[2px] bg-indigo-100 rounded-full"></div>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-indigo-400 uppercase">Sau nén</div>
                    <div className="text-xs font-black text-indigo-600">{formatSize(compressedResult.size)}</div>
                    <div className="text-[10px] font-black text-emerald-500">
                      -{Math.round((1 - compressedResult.size / compressedResult.originalSize) * 100)}%
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-black text-indigo-500 hover:underline"
                >
                  Thử lại với ảnh khác
                </button>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleTestUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white border-t border-indigo-50 flex gap-4 shrink-0">
        <button 
          onClick={handleSave}
          className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Lưu cấu hình & Quay lại
        </button>
      </div>


      {/* Zoomed Preview */}
      <AnimatePresence>
        {isZoomed && compressedResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <img src={compressedResult.url} alt="Zoom" className="max-w-full max-h-full object-contain" />
            <button className="absolute top-8 right-8 p-4 bg-white/10 rounded-full text-white hover:bg-white/20">
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
