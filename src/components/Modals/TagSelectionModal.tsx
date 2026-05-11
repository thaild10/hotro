import React from "react";
import { X, Tag as TagIcon, ChevronLeft, Check, Clock } from "lucide-react";
import { KanbanCard, Tag } from "../../types";
import { motion } from "motion/react";
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
  for (let i = 0; i < tagText.length; i++) hash = (hash * 31 + tagText.charCodeAt(i)) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[hash];
}

interface TagSelectionModalProps {
  card: KanbanCard;
  tagsConfig: Record<number, Tag[]>;
  onClose: () => void;
  onUpdateCard: (updates: Partial<KanbanCard>) => void;
}

export default function TagSelectionModal({ card, tagsConfig, onClose, onUpdateCard }: TagSelectionModalProps) {
  const availTags = tagsConfig[card.tabId] || [];
  const [scheduleTime, setScheduleTime] = React.useState("");
  const [isScheduling, setIsScheduling] = React.useState(false);
  
  const toggleTag = (tagText: string) => {
    if (card.tabId === 5) {
      if (card.tags.includes(tagText)) {
        onUpdateCard({ tags: [] });
      } else {
        if (tagText === "Xếp lịch") {
          setIsScheduling(true);
          return;
        }
        onUpdateCard({ tags: [tagText] });
      }
      return;
    }

    if (card.tags.includes(tagText)) {
      onUpdateCard({ tags: card.tags.filter(t => t !== tagText) });
    } else {
      onUpdateCard({ tags: [...card.tags, tagText] });
    }
  };

  const handleScheduleConfirm = () => {
    if (!scheduleTime.trim()) return;
    const scheduleStr = `🔔 Hẹn: ${scheduleTime}`;
    const newNote = card.note ? `${card.note}\n${scheduleStr}` : scheduleStr;
    onUpdateCard({ 
      tags: ["Xếp lịch"],
      note: newNote
    });
    onClose();
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
        <h3 className="font-black text-lg text-violet-500 uppercase tracking-tight">Gán Thẻ</h3>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50">
        <div className="bg-white p-6 rounded-[40px] border border-pastel-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
                <TagIcon className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-base line-clamp-1">{card.name}</h4>
                <p className="text-[10px] font-black text-pastel-subtext uppercase tracking-widest">Chọn thẻ trạng thái phù hợp</p>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-4">
            {availTags.length > 0 ? availTags.map(tag => {
              const colors = getTagColors(tag.text);
              const isActive = card.tags.includes(tag.text);
              return (
                <button 
                  key={tag.text}
                  onClick={() => toggleTag(tag.text)}
                  className={cn(
                    "py-3.5 px-3 rounded-2xl text-[11px] font-black border transition-all active:scale-95 flex items-center justify-center gap-2",
                    isActive ? cn(colors.bg, colors.text, colors.border, "border-2 shadow-lg shadow-violet-50") : "bg-white text-pastel-subtext border-pastel-border"
                  )}
                >
                  {isActive && <Check className="w-3 h-3" />}
                  {tag.text}
                </button>
              );
            }) : (
              <p className="col-span-2 text-center text-[11px] italic text-pastel-subtext py-10">Không có thẻ nào khả dụng</p>
            )}
          </div>

          {isScheduling && (
            <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Thiết lập giờ hẹn</span>
              </div>
              <input 
                autoFocus
                value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                placeholder="09.00 20.10"
                className="w-full bg-white border-2 border-rose-200 rounded-2xl px-4 py-4 text-center font-black text-xl text-rose-600 outline-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsScheduling(false)} className="flex-1 py-3 bg-white text-slate-400 font-bold text-xs uppercase rounded-xl">Huỷ</button>
                <button onClick={handleScheduleConfirm} className="flex-1 py-3 bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-rose-100">Xác nhận</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-pastel-border">
        <button onClick={onClose} className="w-full py-4.5 bg-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-100 active:scale-95 transition-transform">
          Xác nhận hoàn tất
        </button>
      </div>
    </motion.div>
  );
}
